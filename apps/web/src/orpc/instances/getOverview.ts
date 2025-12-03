import { and, eq, isNotNull } from "drizzle-orm";
import * as z from "zod";

import { sqliteDb } from "~/db/client";
import { instances } from "~/db/schema";
import { env } from "~/env";
import { buildFluxQuery, queryInflux } from "~/lib/influx-query";
import { pick } from "~/lib/typeHelpers";
import { authedProcedure } from "../middleware";

export type InfluxDbInstance = {
  lastUpdate?: Date;
  pvMaxPowerKw?: number;
  loadpointMaxPowerKw?: number;
};

export async function getActiveInfluxDbInstances({
  idFilter,
}: {
  idFilter?: string;
}) {
  const instances = new Map<string, InfluxDbInstance>();

  const rowSchema = z.union([
    z.object({
      result: z.literal("last-update"),
      _value: z.string().or(z.number()),
      instance: z.string(),
      _measurement: z.literal("updated"),
    }),
    z
      .object({
        result: z.literal("pv-capacity"),
        _value: z.number(),
        instance: z.string(),
        _measurement: z.literal("site"),
        _field: z.literal("pvPower"),
      })
      .transform((row) => ({
        ...row,
        // convert to kW
        _value: row._value / 1000,
      })),
    z.object({
      result: z.literal("loadpoint-capacity"),
      _value: z.number(),
      instance: z.string(),
    }),
  ]);

  const query = buildFluxQuery(
    `
        import "strings"
  
        from(bucket: {{bucket}})
          |> range(start: -30d)
          |> filter(fn: (r) => r["_measurement"] == "updated")
          |> last()
          |> filter(fn: (r) => strings.containsStr(v: r["instance"], substr: {{idFilter}}))
          |> yield(name: "last-update")
  
        from(bucket: {{bucket}})
          |> range(start: -365d)
          |> filter(fn: (r) => r["_measurement"] == "site")
          |> filter(fn: (r) => r["_field"] == "pvPower")
          |> max()
          |> filter(fn: (r) => strings.containsStr(v: r["instance"], substr: {{idFilter}}))
          |> yield(name: "pv-capacity")
  
        from(bucket: {{bucket}})
          |> range(start: -365d)
          |> filter(fn: (r) => r["_measurement"] == "loadpoints")
          |> filter(fn: (r) => r["_field"] == "effectiveMaxCurrent")
          |> last()
          |> filter(fn: (r) => strings.containsStr(v: r["instance"], substr: {{idFilter}}))
          |> group(columns: ["instance"])
          |> sum()
          |> yield(name: "loadpoint-capacity")
       `,
    {
      bucket: env.INFLUXDB_BUCKET,
      idFilter: idFilter ?? "",
    },
  );

  try {
    await queryInflux(query, rowSchema, (data) => {
      // use existing instance if it exists
      const instance = instances.get(data.instance) ?? {};

      switch (data.result) {
        case "last-update":
          instance.lastUpdate = new Date(+data._value * 1000);
          break;
        case "pv-capacity":
          instance.pvMaxPowerKw = data._value;
          break;
        case "loadpoint-capacity":
          instance.loadpointMaxPowerKw = data._value;
          break;
      }

      instances.set(data.instance, instance);
    });
  } catch (error) {
    console.error("InfluxDB query error:", error);
    return instances;
  }
  return instances;
}

export type InstanceOverview = {
  id: string;
  publicName: string | null;
  lastReceivedDataAt: Date | null;
  firstReceivedDataAt: Date | null;
  pvMaxPowerKw?: number;
  loadpointMaxPowerKw?: number;
};
export type InstancesOverview = InstanceOverview[];

export const getInstancesOverview = authedProcedure
  .input(
    z
      .object({
        idFilter: z.string().optional(),
        showIgnored: z.boolean().optional().default(false),
      })
      .optional(),
  )
  .handler(async ({ input }) => {
    const persistedInstances = await sqliteDb.query.instances.findMany({
      where: and(
        input?.showIgnored ? undefined : eq(instances.ignored, false),
        isNotNull(instances.lastReceivedDataAt),
        isNotNull(instances.publicName),
      ),
    });

    const influxDbInstances = await getActiveInfluxDbInstances({
      idFilter: input?.idFilter,
    });

    return persistedInstances
      .map((instance) => {
        return {
          ...pick(instance, [
            "id",
            "publicName",
            "lastReceivedDataAt",
            "firstReceivedDataAt",
            "lastExtractedDataAt",
          ]),
          ...influxDbInstances.get(instance.id),
        };
      })
      .sort(
        (a, b) =>
          (b.lastReceivedDataAt?.getTime() ?? 0) -
          (a.lastReceivedDataAt?.getTime() ?? 0),
      );
  });
