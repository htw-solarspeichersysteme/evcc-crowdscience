import { os } from "@orpc/server";
import z from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";

const vehicleMetadataRowSchema = z
  .object({
    _field: z.string(),
    _value: z.union([z.string(), z.number(), z.boolean()]),
    _time: z.string().transform((v) => new Date(v)),
    vehicleId: z.string(),
  })
  .transform((original) => ({
    field: original._field,
    value: original._value,
    lastUpdate: original._time,
    vehicleId: original.vehicleId,
  }));

export const vehiclesRouter = {
  getMetaData: os
    .input(z.object({ instanceId: z.string() }))
    .handler(async ({ input }) => {
      const rows = await influxDb.collectRows(
        `from(bucket: "${env.INFLUXDB_BUCKET}")
          |> range(start: -${instanceCountsAsActiveDays}d)
          |> filter(fn: (r) => r["_measurement"] == "vehicles")
          |> filter(fn: (r) => r["instance"] == "${input.instanceId}")
          |> last()
       `,
      );
      const res = vehicleMetadataRowSchema.array().safeParse(rows);
      if (!res.success) {
        console.error(res.error);
        return {};
      }
      return res.data.reduce(
        (acc, item) => {
          if (!acc[item.vehicleId]) {
            acc[item.vehicleId] = {};
          }
          acc[item.vehicleId][item.field] = {
            value: item.value,
            lastUpdate: item.lastUpdate,
          };
          return acc;
        },
        {} as Record<
          string,
          Record<string, { value: string | number | boolean; lastUpdate: Date }>
        >,
      );
    }),
};
