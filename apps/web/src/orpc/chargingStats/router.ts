import { os } from "@orpc/server";
import { sum } from "simple-statistics";
import { z } from "zod";

import { influxDb } from "~/db/client";
import { env } from "~/env";
import { instanceIdsFilterSchema } from "~/lib/globalSchemas";

export const chargingStatsRouter = {
  getChargingHourHistogram: os
    .input(instanceIdsFilterSchema)
    .handler(async ({ input }) => {
      const res: Record<string, number[]> = {};
      const rowSchema = z.object({
        _value: z.number(),
        le: z.number(),
        instance: z.string(),
      });

      for await (const { values, tableMeta } of influxDb.iterateRows(`
      import "date"
      import "array"
      instanceIds = ${JSON.stringify(input.instanceIds)}

      from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: -30d)
        |> filter(fn: (r) => r["_measurement"] == "loadpoints" and r["_field"] == "chargeCurrent")
        |> window(every: 1h, createEmpty: false)
        |> max()
        ${input.instanceIds?.length ? `|> filter(fn: (r) => contains(value: r["instance"], set: instanceIds))` : ""}
        |> group(columns: ["instance"])
        |> filter(fn: (r) => r["_value"] > 0)
        |> map(fn: (r) => ({
            r with
            floatHour: float(v: date.hour(t: r._time))
          }))
        |> histogram(bins: linearBins(count: 24, width: 1.0, start: 0.0), column: "floatHour")
        |> group(columns: ["le"])
    `)) {
        const row = tableMeta.toObject(values);
        const parsedRow = rowSchema.parse(row);

        if (!res[parsedRow.instance]) {
          res[parsedRow.instance] = [];
        }
        if (parsedRow.le <= 23) {
          res[parsedRow.instance].push(parsedRow._value);
        }
      }

      // go over every instance and calculate the difference between the values
      // from behind, leave first as it is
      for (const instance in res) {
        for (let i = res[instance].length - 1; i > 0; i--) {
          res[instance][i] = res[instance][i] - res[instance][i - 1];
        }
      }
      return Object.fromEntries(
        Object.entries(res).sort((a, b) => sum(b[1]) - sum(a[1])),
      );
    }),
};

