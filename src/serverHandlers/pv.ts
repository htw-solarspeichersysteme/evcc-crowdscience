import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { router } from "react-query-kit";
import { z } from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";

const pvMetadataRowSchema = z
  .object({
    _field: z
      .enum(["energy", "power", "excessDCPower", "currents", "powers"])
      .or(z.string()),
    _value: z.union([z.number(), z.string(), z.boolean()]),
    _time: z.string().transform((v) => new Date(v)),
    componentId: z.string(),
  })
  .transform((original) => ({
    field: original._field,
    value: original._value,
    lastUpdate: original._time,
    componentId: original.componentId,
  }));

export const getPvMetaData = createServerFn()
  .validator(zodValidator(z.object({ instanceId: z.string() })))
  .handler(async ({ data }) => {
    const rows = await influxDb.collectRows(
      `from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: -${instanceCountsAsActiveDays}d)
        |> filter(fn: (r) => r["_measurement"] == "pv")
        |> filter(fn: (r) => r["instance"] == "${data.instanceId}")
        |> last()
     `,
    );

    const res = pvMetadataRowSchema.array().parse(rows);
    return res.reduce(
      (acc, item) => {
        if (!acc[item.componentId]) {
          acc[item.componentId] = {};
        }
        acc[item.componentId][item.field] = {
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

export const pvApi = router("pv", {
  getPvMetaData: router.query({ fetcher: getPvMetaData }),
});
