import { eq, isNull, sql } from "drizzle-orm";
import z from "zod";

import { influxDb, sqliteDb } from "~/db/client";
import { instances, instances as instancesTable } from "~/db/schema";
import { env } from "~/env";
import { generatePublicName } from "~/lib/publicNameGenerator";
import {
  getActiveInfluxDbInstances,
  type InfluxDbInstance,
} from "~/orpc/instances/getOverview";

async function createInstance(id: string, influxDbInstance: InfluxDbInstance) {
  return await sqliteDb
    .insert(instances)
    .values({
      id,
      publicName: generatePublicName(),
      lastReceivedDataAt: influxDbInstance.lastUpdate,
    })
    .returning()
    .then((instances) => instances[0]);
}

async function setFirstReceivedDataAt(instanceId: string) {
  const row = await influxDb
    .collectRows(
      `from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: -5y)
        |> filter(fn: (r) => r["_measurement"] == "updated")
        |> filter(fn: (r) => r["instance"] == "${instanceId}")
        |> first()
      `,
    )
    .then((rows) => rows[0]);

  const { success, data } = z
    .object({ _value: z.number() })
    .transform((row) => new Date(row._value * 1000))
    .safeParse(row);

  if (success) {
    await sqliteDb
      .update(instances)
      .set({ firstReceivedDataAt: data })
      .where(eq(instances.id, instanceId));
  }
}

export async function enrichInstancesMetadata() {
  // persist the active influxdb instances to the sqlite database
  const influxDbInstances = await getActiveInfluxDbInstances({}).then(
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
    influxDbInstance.lastUpdate &&
      (await sqliteDb
        .update(instances)
        .set({ lastReceivedDataAt: influxDbInstance.lastUpdate })
        .where(eq(instances.id, id)));

    // try setting the first received data at if not already set
    if (influxDbInstance.lastUpdate && !sqliteInstance.firstReceivedDataAt) {
      await setFirstReceivedDataAt(id);
      console.log(
        `[SQLITE] set first received data at for instance "${id}" to "${influxDbInstance.lastUpdate}"`,
      );
    }
  }
}

if (import.meta.main) {
  void enrichInstancesMetadata();
}
