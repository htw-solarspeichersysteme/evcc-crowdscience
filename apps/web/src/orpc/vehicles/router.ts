import { z } from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { buildFluxQuery } from "~/lib/influx-query";
import { influxProcedureWithErrorHandling } from "../middleware";
import { influxRowBaseSchema, type MetaData } from "../types";

const vehicleMetadataRowSchema = influxRowBaseSchema.extend({
  vehicleId: z.string().optional(),
});
export const vehiclesRouter = {
  getMetaData: influxProcedureWithErrorHandling
    .input(z.object({ instanceId: z.string() }))
    .handler(async ({ input }) => {
      const metaData: MetaData = { values: {}, count: 0 };
      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
          |> range(start: {{rangeStart}})
          |> filter(fn: (r) => r["_measurement"] == "vehicles")
          |> filter(fn: (r) => r["instance"] == {{instanceId}})
          |> last()`,
        {
          bucket: env.INFLUXDB_BUCKET,
          rangeStart: `-${instanceCountsAsActiveDays}d`,
          instanceId: input.instanceId,
        },
      );
      const rows = await influxDb.collectRows(query);
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
