import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { router } from "react-query-kit";
import { z } from "zod";

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

export const getVehicleMetaData = createServerFn()
  .validator(zodValidator(z.object({ instanceId: z.string() })))
  .handler(async ({ data }) => {
    const rows = await influxDb.collectRows(
      `from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: -${instanceCountsAsActiveDays}d)
        |> filter(fn: (r) => r["_measurement"] == "vehicles")
        |> filter(fn: (r) => r["instance"] == "${data.instanceId}")
        |> last()
     `,
    );
    const res = vehicleMetadataRowSchema.array().parse(rows);
    return res.reduce(
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
  });

export const vehicleApi = router("vehicle", {
  getVehicleMetaData: router.query({ fetcher: getVehicleMetaData }),
});
