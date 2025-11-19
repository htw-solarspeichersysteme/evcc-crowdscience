import { os } from "@orpc/server";
import type { AlignedData } from "uplot";
import z from "zod";

import { influxDb } from "~/db/client";
import { env } from "~/env";
import { timeRangeInputSchema } from "~/lib/globalSchemas";
import { buildFluxQuery } from "~/lib/influx-query";

export const getSendingActivity = os
  .input(z.object({ instanceId: z.string(), timeRange: timeRangeInputSchema }))
  .handler(async ({ input }) => {
    const res: [number[], number[]] = [[], []];
    const rowSchema = z.object({
      _value: z.string().or(z.number()).nullable(),
      _time: z.coerce.date(),
    });

    const query = buildFluxQuery(
      `from(bucket: {{bucket}})
        |> range(start: {{start}}, stop: {{stop}})
        |> filter(fn: (r) => r["_measurement"] == "updated")
        |> filter(fn: (r) => r["instance"] == {{instanceId}})
        |> aggregateWindow(every: {{windowMinutes}}, fn: last, createEmpty: true)
        |> yield(name: "last")`,
      {
        bucket: env.INFLUXDB_BUCKET,
        start: input.timeRange.start,
        stop: input.timeRange.end,
        instanceId: input.instanceId,
        windowMinutes: `${input.timeRange.windowMinutes}m`,
      },
    );

    try {
      for await (const { values, tableMeta } of influxDb.iterateRows(query)) {
        const row = tableMeta.toObject(values);
        const parsedRow = rowSchema.safeParse(row);
        if (!parsedRow.success) {
          console.error(parsedRow.error, row);
          continue;
        }
        res[0].push(parsedRow.data._time.getTime() / 1000);
        res[1].push(parsedRow.data._value ? 1 : 0);
      }
    } catch (error) {
      console.error("InfluxDB query error:", error);
      return res satisfies AlignedData;
    }

    return res satisfies AlignedData;
  });
