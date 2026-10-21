import { eq } from "drizzle-orm";
import * as z from "zod";

import { sqliteDb } from "~/db/client";
import { instances } from "~/db/schema";
import { env } from "~/env";
import { buildFluxQuery, queryInflux } from "~/lib/influx-query";
import { generatePublicName } from "~/lib/publicNameGenerator";

type InfluxDbInstance = {
  lastUpdate?: number;
};

async function getRecentInfluxDbLastUpdates() {
  const lastUpdates = new Map<string, InfluxDbInstance>();

  const query = buildFluxQuery(
    `from(bucket: {{bucket}})
      |> range(start: -1d)
      |> filter(fn: (r) => r["_measurement"] == "updated")
      |> last()`,
    { bucket: env.INFLUXDB_BUCKET },
  );

  await queryInflux(
    query,
    z.object({ _value: z.coerce.number(), instance: z.string() }),
    (row) => lastUpdates.set(row.instance, { lastUpdate: row._value * 1000 }),
  );

  return lastUpdates;
}

type InfluxDbInstanceStats = {
  pvMaxPowerKw?: number;
  loadpointMaxPowerKw?: number;
  siteVersion?: string;
};

async function getInfluxDbInstanceStats() {
  const stats = new Map<string, InfluxDbInstanceStats>();

  const rowSchema = z.union([
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
    z.object({
      result: z.literal("site"),
      _value: z.string(),
      instance: z.string(),
      _measurement: z.literal("site"),
      _field: z.literal("version"),
    }),
  ]);

  const query = buildFluxQuery(
    `
        from(bucket: {{bucket}})
          |> range(start: -30d)
          |> filter(fn: (r) => r["_measurement"] == "site")
          |> filter(fn: (r) => r["_field"] == "version")
          |> last()
          |> yield(name: "site")

        from(bucket: {{bucket}})
          |> range(start: -365d)
          |> filter(fn: (r) => r["_measurement"] == "pv")
          |> filter(fn: (r) => r["_field"] == "power")
          |> max()
          |> group(columns: ["instance"])
          |> sum()
          |> yield(name: "pv-capacity")

        from(bucket: {{bucket}})
          |> range(start: -365d)
          |> filter(fn: (r) => r["_measurement"] == "site")
          |> filter(fn: (r) => r["_field"] == "pvPower")
          |> max()
          |> yield(name: "pv-capacity-legacy")

        from(bucket: {{bucket}})
          |> range(start: -365d)
          |> filter(fn: (r) => r["_measurement"] == "loadpoints")
          |> filter(fn: (r) => r["_field"] == "effectiveMaxCurrent")
          |> last()
          |> group(columns: ["instance"])
          |> sum()
          |> yield(name: "loadpoint-capacity")
       `,
    { bucket: env.INFLUXDB_BUCKET },
  );

  await queryInflux(query, rowSchema, (data) => {
    const instance = stats.get(data.instance) ?? {};

    switch (data.result) {
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
      case "site":
        instance.siteVersion = data._value;
        break;
    }

    stats.set(data.instance, instance);
  });

  return stats;
}

async function createInstance(id: string, influxDbInstance: InfluxDbInstance) {
  return await sqliteDb
    .insert(instances)
    .values({
      id,
      publicName: generatePublicName(),
      lastReceivedDataAt: influxDbInstance.lastUpdate
        ? new Date(influxDbInstance.lastUpdate)
        : null,
    })
    .returning()
    .then((instances) => instances[0]);
}

async function setFirstReceivedDataAt(instanceId: string) {
  const query = buildFluxQuery(
    `from(bucket: {{bucket}})
      |> range(start: -5y)
      |> filter(fn: (r) => r["_measurement"] == "updated")
      |> filter(fn: (r) => r["instance"] == {{instanceId}})
      |> first()`,
    {
      bucket: env.INFLUXDB_BUCKET,
      instanceId,
    },
  );

  const rows = await queryInflux(query, z.object({ _value: z.number() }));
  const row = rows[0];

  if (row) {
    const firstReceivedDataAt = new Date(row._value * 1000);
    await sqliteDb
      .update(instances)
      .set({ firstReceivedDataAt })
      .where(eq(instances.id, instanceId));
  }
}

/**
 * Synchronize Metadata (like last update, public name) to the sqlite database
 */
export async function enrichInstancesMetadata() {
  // persist the active influxdb instances to the sqlite database
  const influxDbInstances = await getRecentInfluxDbLastUpdates().then(
    (instances) => Array.from(instances.entries()),
  );

  for (const [id, influxDbInstance] of influxDbInstances) {
    // find matching instance in the sqlite database
    let sqliteInstance = await sqliteDb.query.instances.findFirst({
      where: eq(instances.id, id),
    });

    // create the instance in the sqlite database if it doesn't exist
    if (!sqliteInstance) {
      sqliteInstance = await createInstance(id, influxDbInstance);
      console.log(
        `[SQLITE] created instance "${id}" with public name "${sqliteInstance.publicName}"`,
      );
    }

    // set a public name if not already set
    if (sqliteInstance.publicName === null) {
      const publicName = generatePublicName();
      await sqliteDb
        .update(instances)
        .set({ publicName })
        .where(eq(instances.id, id));
      console.log(
        `[SQLITE] set public name "${publicName}" for instance "${id}"`,
      );
    }

    // set the last received data
    if (influxDbInstance.lastUpdate) {
      await sqliteDb
        .update(instances)
        .set({ lastReceivedDataAt: new Date(influxDbInstance.lastUpdate) })
        .where(eq(instances.id, id));
    }

    // try setting the first received data at if not already set
    if (influxDbInstance.lastUpdate && !sqliteInstance.firstReceivedDataAt) {
      await setFirstReceivedDataAt(id);
      console.log(
        `[SQLITE] set first received data at for instance "${id}" to "${new Date(influxDbInstance.lastUpdate).toISOString()}"`,
      );
    }
  }
}

/**
 * Persist the 365-day PV/loadpoint maxima and the site version, which are too slow to query on page load
 */
export async function enrichInstancesStats() {
  const stats = await getInfluxDbInstanceStats();

  for (const [id, instanceStats] of stats) {
    await sqliteDb
      .update(instances)
      .set(instanceStats)
      .where(eq(instances.id, id));
  }
}

if (import.meta.main) {
  void enrichInstancesMetadata();
}
