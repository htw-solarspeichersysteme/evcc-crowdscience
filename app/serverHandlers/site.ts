import { zodValidator } from "@tanstack/zod-adapter";
import { createServerFn } from "node_modules/@tanstack/start/dist/esm/client/createServerFn";
import { router } from "react-query-kit";
import { z } from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";

const siteMetadataRowSchema = z
  .object({
    _field: z.string(),
    _value: z.union([z.string(), z.number(), z.boolean()]),
    _time: z.string().transform((v) => new Date(v)),
  })
  .transform((original) => ({
    field: original._field,
    value: original._value,
    lastUpdate: original._time,
  }));

export const getSiteMetaData = createServerFn()
  .validator(zodValidator(z.object({ instanceId: z.string() })))
  .handler(async ({ data }) => {
    const rows = await influxDb.collectRows(
      `from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: -${instanceCountsAsActiveDays}d)
        |> filter(fn: (r) => r["_measurement"] == "site")
        |> filter(fn: (r) => r["instance"] == "${data.instanceId}")
        |> last()
     `,
    );

    const res = siteMetadataRowSchema.array().parse(rows);

    return res.reduce(
      (acc, row) => {
        acc[row.field] = { value: row.value, lastUpdate: row.lastUpdate };
        return acc;
      },
      {} as Record<
        string,
        { value: string | number | boolean; lastUpdate: Date } | undefined
      >,
    );
  });

export const siteApi = router("site", {
  getSiteMetaData: router.query({ fetcher: getSiteMetaData }),
});
