import { and, eq, isNotNull } from "drizzle-orm";
import * as z from "zod";

import { sqliteDb } from "~/db/client";
import { instances } from "~/db/schema";
import { env } from "~/env";
import { buildFluxQuery, queryInflux } from "~/lib/influx-query";
import { pick } from "~/lib/typeHelpers";
import { instancesOverviewInputSchema } from "~/schema/instances";
import { authedProcedure } from "../middleware";

export type InfluxDbInstance = {
  lastUpdate?: number;
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
      _value: z.coerce.number(),
      instance: z.string(),
      _measurement: z.literal("updated"),
    }),
    z
      .object({
        result: z.union([
          z.literal("pv-capacity"),
          z.literal("pv-capacity-legacy"),
        ]),
        _value: z.number(),
        instance: z.string(),
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
          |> filter(fn: (r) => r["_measurement"] == "pv")
          |> filter(fn: (r) => r["_field"] == "power")
          |> max()
          |> filter(fn: (r) => strings.containsStr(v: r["instance"], substr: {{idFilter}}))
          |> group(columns: ["instance"])
          |> sum()
          |> yield(name: "pv-capacity")

        from(bucket: {{bucket}})
          |> range(start: -365d)
          |> filter(fn: (r) => r["_measurement"] == "site")
          |> filter(fn: (r) => r["_field"] == "pvPower")
          |> max()
          |> filter(fn: (r) => strings.containsStr(v: r["instance"], substr: {{idFilter}}))
          |> yield(name: "pv-capacity-legacy")
  
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
          instance.lastUpdate = data._value * 1000;
          break;
        case "pv-capacity":
        case "pv-capacity-legacy":
          instance.pvMaxPowerKw = Math.max(
            instance.pvMaxPowerKw ?? 0,
            data._value,
          );
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
  lastReceivedDataAt: number | null;
  firstReceivedDataAt: number | null;
  pvMaxPowerKw?: number;
  loadpointMaxPowerKw?: number;
};
export type InstancesOverview = InstanceOverview[];

export const getInstancesOverview = authedProcedure
  .route({
    tags: ["Instances"],
    summary: "Get instances overview",
    description:
      "Retrieves a comprehensive overview of all instances including data from both SQLite and InfluxDB, with filtering options",
  })
  .input(instancesOverviewInputSchema)
  .output(
    z
      .array(
        z.object({
          id: z.string().describe("Unique instance identifier (UUIDv7)"),
          publicName: z
            .string()
            .nullable()
            .describe("Human-readable public name"),
          lastReceivedDataAt: z.coerce
            .number()
            .nullable()
            .describe("Timestamp of last received data in milliseconds"),
          firstReceivedDataAt: z.coerce
            .number()
            .nullable()
            .describe("Timestamp of first received data in milliseconds"),
          lastExtractedDataAt: z.coerce
            .number()
            .nullable()
            .describe("Timestamp of last data extraction in milliseconds"),
          pvMaxPowerKw: z
            .number()
            .optional()
            .describe("Maximum PV power in kW found in history"),
          loadpointMaxPowerKw: z
            .number()
            .optional()
            .describe("Maximum loadpoint power in kW found in history"),
        }),
      )
      .meta({
        examples: [
          [
            {
              id: "018f3d4a-5b6c-7d8e-af01-23456789abcd",
              publicName: "shiny-mountain-123",
              lastReceivedDataAt: 1704110400000,
              firstReceivedDataAt: 1704024000000,
              pvMaxPowerKw: 5.5,
              loadpointMaxPowerKw: 11.0,
            },
          ],
        ],
      }),
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
