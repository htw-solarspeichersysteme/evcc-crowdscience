import { ORPCError, os } from "@orpc/server";
import { env } from "bun";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { influxDb, sqliteDb } from "~/db/client";
import { instances } from "~/db/schema";
import { generatePublicName } from "~/lib/publicNameGenerator";
import { authedProcedure } from "../middleware";
import { getInstancesOverview } from "./getOverview";
import { getSendingActivity } from "./getSendingActivity";

export const instancesRouter = {
  generateId: os.handler(async () => {
    // generate a new instance id and public name
    const instanceIdPair = {
      id: Bun.randomUUIDv7(),
      publicName: generatePublicName(),
    };

    await sqliteDb.insert(instances).values(instanceIdPair);

    return instanceIdPair;
  }),
  getById: authedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const instance = await sqliteDb.query.instances.findFirst({
        where: eq(instances.id, input.id),
      });

      if (!instance) {
        throw new ORPCError("NOT_FOUND", { message: "Instance not found" });
      }

      return instance;
    }),
  getOverview: getInstancesOverview,
  getSendingActivity,
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

      const res = z.object({ _value: z.number() }).safeParse(rows?.[0]);
      if (!res.success) {
        console.error(res.error);
        return null;
      }

      return new Date(res.data._value * 1000);
    }),
};
