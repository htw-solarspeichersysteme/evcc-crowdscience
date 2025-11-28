import { os } from "@orpc/server";
import { min } from "date-fns";
import * as z from "zod";

import { env } from "~/env";
import { timeRangeInputSchema } from "~/lib/globalSchemas";
import { buildFluxQuery, queryInflux } from "~/lib/influx-query";
import { possibleChartTopicsConfig } from "~/lib/time-series-config";

const validChartTopics = Object.keys(possibleChartTopicsConfig);

export const timeSeriesRouter = {
  getData: os
    .input(
      z.object({
        chartTopic: z.string().refine((val) => validChartTopics.includes(val), {
          message: `chartTopic must be one of: ${validChartTopics.join(", ")}`,
        }),
        instanceId: z.string().min(1),
        timeRange: timeRangeInputSchema,
        chartTopicField: z.string().optional(),
        componentId: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const tables = new Map<
        number,
        {
          field: string;
          data: [number, number | string | null][];
          metadata: {
            componentId?: string;
            vehicleId?: string;
            phase?: string;
            circuitId?: string;
            gridId?: string;
          };
        }
      >();

      const rowSchema = z.object({
        _field: z.string(),
        _value: z.union([z.number(), z.string()]).nullable().catch(null),
        _time: z.coerce.date(),
        table: z.number(),
        // optional metadata fields
        componentId: z.string().optional(),
        vehicleId: z.string().optional(),
        phase: z.string().optional(),
        circuitId: z.string().optional(),
        gridId: z.string().optional(),
      });

      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
          |> range(start: {{start}}, stop: {{stop}})
          |> filter(fn: (r) => r["instance"] == {{instanceId}})
          |> filter(fn: (r) => r["_measurement"] == {{chartTopic}})
          ${input.chartTopicField ? `|> filter(fn: (r) => r["_field"] == {{chartTopicField}})` : ""}
          ${input.componentId ? `|> filter(fn: (r) => r["componentId"] == {{componentId}})` : ""}
          ${
            input.timeRange.windowMinutes > 0
              ? `
          |> aggregateWindow(every: {{windowMinutes}}, fn: last, createEmpty: true)
          |> fill(column: "_value", usePrevious: true)`
              : ""
          }
          |> yield(name: "last")
          `,
        {
          bucket: env.INFLUXDB_BUCKET,
          start: input.timeRange.start,
          stop: min([input.timeRange.end, new Date()]),
          instanceId: input.instanceId,
          chartTopic: input.chartTopic,
          windowMinutes: `${input.timeRange.windowMinutes}m`,
          chartTopicField: input.chartTopicField ?? "",
          componentId: input.componentId ?? "",
        },
      );

      await queryInflux(query, rowSchema, (row) => {
        if (!tables.has(row.table)) {
          tables.set(row.table, {
            field: row._field,
            data: [],
            metadata: {
              componentId: row.componentId,
              vehicleId: row.vehicleId,
              phase: row.phase,
              circuitId: row.circuitId,
              gridId: row.gridId,
            },
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
