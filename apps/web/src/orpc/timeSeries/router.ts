import { os } from "@orpc/server";
import { min } from "date-fns";
import type { AlignedData } from "uplot";
import { z } from "zod";

import { possibleInstanceTimeSeriesMetrics } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { timeRangeInputSchema } from "~/lib/globalSchemas";

export const timeSeriesRouter = {
  getTimeSeriesData: os
    .input(
      z
        .object({
          metric: z.enum(possibleInstanceTimeSeriesMetrics),
          instanceId: z.string(),
        })
        .extend(timeRangeInputSchema.shape),
    )
    .handler(async ({ input }) => {
      const res: [number[], (number | null)[]] = [[], []];

      const rowSchema = z
        .object({
          _value: z
            .union([z.number(), z.string().min(1)])
            .nullable()
            .catch(null),
          _time: z.coerce.date(),
          _start: z.coerce.date(),
          _stop: z.coerce.date(),
        })
        .transform(
          (r) =>
            [r._time.getTime(), r._value ? Number(r._value) : null] as const,
        );

      if (input.timeRange.end.getTime() < input.timeRange.start.getTime()) {
        return res satisfies AlignedData;
      }

      for await (const { values, tableMeta } of influxDb.iterateRows(
        `from(bucket: "${env.INFLUXDB_BUCKET}")
          |> range(start: ${input.timeRange.start.toISOString()}, stop: ${min([
            input.timeRange.end,
            new Date(),
          ]).toISOString()})
          |> filter(fn: (r) => r["instance"] == "${input.instanceId}")
          |> filter(fn: (r) => r["_field"] == "${input.metric}")
          |> aggregateWindow(every: ${input.timeRange.windowMinutes}m, fn: last, createEmpty: true)
          |> fill(column: "_value", usePrevious: true)
          |> yield(name: "last")
       `,
      )) {
        const row = tableMeta.toObject(values);
        const parsedRow = rowSchema.parse(row);
        res[0].push(parsedRow[0] / 1000);
        res[1].push(parsedRow[1]);
      }

      // we don't query future data, so fill the rest up with nulls
      if (input.timeRange.end.getTime() > Date.now()) {
        const totalBlocks = Math.ceil(
          (input.timeRange.end.getTime() - input.timeRange.start.getTime()) /
            (input.timeRange.windowMinutes * 60 * 1000),
        );
        for (let i = res[0].length; i <= totalBlocks; i++) {
          res[0].push(
            (input.timeRange.start.getTime() +
              input.timeRange.windowMinutes * 60 * 1000 * i) /
              1000,
          );
          res[1].push(null);
        }
      }

      return res satisfies AlignedData;
    }),
};
