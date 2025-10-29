import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { router } from "react-query-kit";
import { z } from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";

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

export const getSiteStatistics = createServerFn()
  .inputValidator(zodValidator(z.object({ instanceId: z.string() })))
  .handler(async ({ data }) => {
    const rows = await influxDb.collectRows(
      `from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: -${instanceCountsAsActiveDays}d)
        |> filter(fn: (r) => r["_measurement"] == "statistics")
        |> filter(fn: (r) => r["instance"] == "${data.instanceId}")
        |> last()
     `,
    );

    const res = siteStatisticsRowSchema.array().parse(rows);

    return res.reduce(
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
  });

export const siteApi = router("site", {
  getSiteStatistics: router.query({ fetcher: getSiteStatistics }),
});
