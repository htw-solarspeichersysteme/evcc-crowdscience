import { min } from "date-fns";
import * as z from "zod";

import { env } from "~/env";
import { timeRangeInputSchema } from "~/lib/globalSchemas";
import { buildFluxQuery, queryInflux } from "~/lib/influx-query";
import { possibleChartTopicsConfig } from "~/lib/time-series-config";
import { authedProcedure } from "../middleware";

const validChartTopics = Object.keys(possibleChartTopicsConfig);

export const timeSeriesRouter = {
  getData: authedProcedure
    .input(
      z.object({
        chartTopic: z.string().refine((val) => validChartTopics.includes(val), {
          message: `chartTopic must be one of: ${validChartTopics.join(", ")}`,
        }),
        instanceId: z.string().min(1),
        timeRange: timeRangeInputSchema,
      }),
    )
    .handler(async ({ input }) => {
      const tables = new Map<
        number,
        {
          field: string;
          componentId?: string;
          vehicleId?: string;
          data: [number, number | string | null][];
        }
      >();

      const rowSchema = z.object({
        _field: z.string(),
        _value: z.union([z.number(), z.string()]).nullable().catch(null),
        _time: z.coerce.date(),
        componentId: z.string().optional(),
        vehicleId: z.string().optional(),
        table: z.number(),
      });

      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
          |> range(start: {{start}}, stop: {{stop}})
          |> filter(fn: (r) => r["instance"] == {{instanceId}})
          |> filter(fn: (r) => r["_measurement"] == {{chartTopic}})
          |> aggregateWindow(every: {{windowMinutes}}, fn: last)
          |> fill(column: "_value", usePrevious: true)
          |> yield(name: "last")`,
        {
          bucket: env.INFLUXDB_BUCKET,
          start: input.timeRange.start,
          stop: min([input.timeRange.end, new Date()]),
          instanceId: input.instanceId,
          chartTopic: input.chartTopic,
          windowMinutes: `${input.timeRange.windowMinutes}m`,
        },
      );

      await queryInflux(query, rowSchema, (row) => {
        if (!tables.has(row.table)) {
          tables.set(row.table, {
            field: row._field,
            componentId: row.componentId,
            vehicleId: row.vehicleId,
            data: [],
          });
        }
        tables
          .get(row.table)!
          .data.push([
            new Date(row._time).getTime(),
            row._value ? Number(row._value) : null,
          ]);
      });

      return Array.from(tables.values());
    }),
};
