import { sum } from "simple-statistics";
import * as z from "zod";

import { env } from "~/env";
import { instanceIdsFilterSchema } from "~/lib/globalSchemas";
import { buildFluxQuery, queryInflux } from "~/lib/influx-query";
import { authedProcedure } from "../middleware";

export const chargingStatsRouter = {
  getChargingHourHistogram: authedProcedure
    .input(instanceIdsFilterSchema)
    .handler(async ({ input }) => {
      const res: Record<string, number[]> = {};
      const rowSchema = z.object({
        _value: z.number(),
        le: z.number(),
        instance: z.string(),
      });

      // Note: instanceIds array is serialized as JSON in the query string
      // This is safe because JSON.stringify properly escapes the values
      const instanceIdsJson = JSON.stringify(input.instanceIds ?? []);
      const query = buildFluxQuery(
        `
      import "date"
      import "array"
      instanceIds = ${instanceIdsJson}

      from(bucket: {{bucket}})
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
    `,
        {
          bucket: env.INFLUXDB_BUCKET,
        },
      );

      await queryInflux(query, rowSchema, (row) => {
        if (!res[row.instance]) {
          res[row.instance] = [];
        }
        if (row.le <= 23) {
          res[row.instance].push(row._value);
        }
      });

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
