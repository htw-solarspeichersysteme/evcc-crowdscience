import { os } from "@orpc/server";
import { z } from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { influxRowBaseSchema, type MetaData } from "../types";

const vehicleMetadataRowSchema = influxRowBaseSchema.extend({
  vehicleId: z.string().optional(),
});
export const vehiclesRouter = {
  getMetaData: os
    .input(z.object({ instanceId: z.string() }))
    .handler(async ({ input }) => {
      const metaData: MetaData = { values: {}, count: 0 };
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
        return metaData;
      }

      for (const item of res.data) {
        if (item._field === "count") metaData.count = Number(item._value);
        if (!item.vehicleId) continue;
        metaData.values[item.vehicleId] ??= {};
        metaData.values[item.vehicleId][item._field] = {
          value: item._value,
          lastUpdate: item._time,
        };
      }

      metaData.count ??= Object.keys(metaData.values).length;

      return metaData;
    }),
};
