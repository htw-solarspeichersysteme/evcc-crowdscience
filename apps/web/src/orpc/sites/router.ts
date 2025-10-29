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

      const res = siteMetadataRowSchema.array().parse(rows);

      return res.reduce(
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
};
