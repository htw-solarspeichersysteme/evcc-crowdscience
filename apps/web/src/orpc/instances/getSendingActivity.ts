import { os } from "@orpc/server";
import type { AlignedData } from "uplot";
import z from "zod";

import { influxDb } from "~/db/client";
import { env } from "~/env";
import { timeRangeInputSchema } from "~/lib/globalSchemas";

export const getSendingActivity = os
  .input(
    z.object({ instanceId: z.string() }).extend(timeRangeInputSchema.shape),
  )
  .handler(async ({ input }) => {
    const res: [number[], number[]] = [[], []];
    const rowSchema = z.object({
      _value: z.string().or(z.number()).nullable(),
      _time: z.coerce.date(),
    });

    for await (const {
      values,
      tableMeta,
    } of influxDb.iterateRows(`from(bucket: "${env.INFLUXDB_BUCKET}")
      |> range(start: ${input.timeRange.start.toISOString()}, stop: ${input.timeRange.end.toISOString()})
      |> filter(fn: (r) => r["_measurement"] == "updated")
      |> filter(fn: (r) => r["instance"] == "${input.instanceId}")
      |> aggregateWindow(every: ${input.timeRange.windowMinutes}m, fn: last, createEmpty: true)
      |> yield(name: "last")
    `)) {
      const row = tableMeta.toObject(values);
      const parsedRow = rowSchema.safeParse(row);
      if (!parsedRow.success) {
        console.error(parsedRow.error, row);
        continue;
      }
      res[0].push(parsedRow.data._time.getTime() / 1000);
      res[1].push(parsedRow.data._value ? 1 : 0);
    }

    return res satisfies AlignedData;
  });
