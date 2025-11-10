import { os } from "@orpc/server";
import { min } from "date-fns";
import { z } from "zod";

import { possibleChartTopicsConfig } from "~/lib/time-series-config";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { timeRangeInputSchema } from "~/lib/globalSchemas";

const validChartTopics = Object.keys(possibleChartTopicsConfig);

export const timeSeriesRouter = {
  getData: os
    .input(
      z
        .object({
          chartTopic: z
            .string()
            .refine((val) => validChartTopics.includes(val), {
              message: `chartTopic must be one of: ${validChartTopics.join(", ")}`,
            }),
          instanceId: z.string().min(1),
        })
        .extend(timeRangeInputSchema.shape),
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

      for await (const { values, tableMeta } of influxDb.iterateRows(
        `from(bucket: "${env.INFLUXDB_BUCKET}")
          |> range(start: ${input.timeRange.start.toISOString()}, stop: ${min([
            input.timeRange.end,
            new Date(),
          ]).toISOString()})
          |> filter(fn: (r) => r["instance"] == "${input.instanceId}")
          |> filter(fn: (r) => r["_measurement"] == "${input.chartTopic}")
          |> aggregateWindow(every: ${input.timeRange.windowMinutes}m, fn: last)
          |> fill(column: "_value", usePrevious: true)
          |> yield(name: "last")
       `,
      )) {
        const rawRow = tableMeta.toObject(values);

        const parsedRow = rowSchema.safeParse(rawRow);
        if (!parsedRow.success) {
          console.error(parsedRow.error);
          continue;
        }
        const row = parsedRow.data;

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
      }
      return Array.from(tables.values());
    }),
};
