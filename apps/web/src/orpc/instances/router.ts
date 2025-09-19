import { os } from "@orpc/server";
import { env } from "bun";
import { eq } from "drizzle-orm";
import { humanId } from "human-id";
import { z } from "zod";

import { influxDb, sqliteDb } from "~/db/client";
import { instances } from "~/db/schema";

export const instancesRouter = {
  generateId: os.handler(async () => {
    // try 10 times to generate a unique id
    for (let i = 0; i < 10; i++) {
      const id = humanId({
        separator: "-",
        capitalize: false,
      });

      // check if the id is already in the database
      const instance = await sqliteDb.query.instances.findFirst({
        where: eq(instances.id, id),
      });
      if (!instance) return id;
    }
    throw new Error("Failed to generate a unique id");
  }),
  getMany: os.handler(async () => {
    const instances = await sqliteDb.query.instances.findMany();
    return instances;
  }),
  getLatestUpdate: os
    .input(z.object({ instanceId: z.string() }))
    .handler(async ({ input }) => {
      const rows = await influxDb.collectRows(
        `from(bucket: "${env.INFLUXDB_BUCKET}")
          |> range(start: -1y)
          |> filter(fn: (r) => r["_measurement"] == "updated")
          |> filter(fn: (r) => r["instance"] == "${input.instanceId}")
          |> last()
         `,
      );

      // if no data was found, return null
      if (!rows?.[0]) return null;

      const res = z.object({ _value: z.number() }).parse(rows?.[0]);
      return new Date(res._value * 1000);
    }),
};
