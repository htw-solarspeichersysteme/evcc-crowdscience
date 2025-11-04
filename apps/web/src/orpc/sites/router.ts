import { os } from "@orpc/server";
import { z } from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";

const siteMetadataRowSchema = z
  .object({
    _field: z.string(),
    _value: z.union([z.string(), z.number(), z.boolean()]),
    _time: z.string().transform((v: string) => new Date(v)),
  })
  .transform((original) => ({
    field: original._field,
    value: original._value,
    lastUpdate: original._time,
  }));

const siteStatisticsRowSchema = z
  .object({
    _field: z.enum(["avgCo2", "avgPrice", "chargedKWh", "solarPercentage"]),
    period: z.enum(["30d", "365d", "thisYear", "total"]),
    _value: z.number(),
    _time: z.string().transform((v) => new Date(v)),
  })
  .transform((original) => ({
    field: original._field,
    period: original.period,
    value: original._value,
    lastUpdate: original._time,
  }));

export const sitesRouter = {
  getMetaData: os
    .input(z.object({ instanceId: z.string() }))
    .handler(async ({ input }) => {
      const rows = await influxDb.collectRows(
        `from(bucket: "${env.INFLUXDB_BUCKET}")
          |> range(start: -${instanceCountsAsActiveDays}d)
          |> filter(fn: (r) => r["_measurement"] == "site")
          |> filter(fn: (r) => r["instance"] == "${input.instanceId}")
          |> last()
       `,
      );

      const res = siteMetadataRowSchema.array().safeParse(rows);
      if (!res.success) {
        console.error(res.error);
        return {};
      }

      return res.data.reduce(
        (acc, row) => {
          acc[row.field] = { value: row.value, lastUpdate: row.lastUpdate };
          return acc;
        },
        {} as Record<
          string,
          { value: string | number | boolean; lastUpdate: Date }
        >,
      );
    }),
  getStatistics: os
    .input(z.object({ instanceId: z.string() }))
    .handler(async ({ input }) => {
      const rows = await influxDb.collectRows(
        `from(bucket: "${env.INFLUXDB_BUCKET}")
          |> range(start: -${instanceCountsAsActiveDays}d)
          |> filter(fn: (r) => r["_measurement"] == "statistics")
          |> filter(fn: (r) => r["instance"] == "${input.instanceId}")
          |> last()
       `,
      );

      const res = siteStatisticsRowSchema.array().safeParse(rows);
      if (!res.success) {
        console.error(res.error);
        return {};
      }

      return res.data.reduce(
        (acc, row) => {
          acc[row.period] = acc[row.period] ?? {};
          acc[row.period][row.field] = {
            value: row.value,
            lastUpdate: row.lastUpdate,
          };
          return acc;
        },
        {} as Record<
          z.infer<typeof siteStatisticsRowSchema>["period"],
          Record<
            z.infer<typeof siteStatisticsRowSchema>["field"],
            { value: number; lastUpdate: Date }
          >
        >,
      );
    }),
};
