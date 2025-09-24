import { os } from "@orpc/server";
import { env } from "bun";
import { eq } from "drizzle-orm";
import { humanId } from "human-id";
import { z } from "zod";

import { influxDb, sqliteDb } from "~/db/client";
import { instances } from "~/db/schema";
import { authedProcedure } from "../middleware";
import { getInstancesOverview } from "./getOverview";

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
  getById: authedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      return await getInstancesOverview({ idFilter: input.id }).then(
        (data) => data[0],
      );
    }),
  getOverview: authedProcedure.handler(
    async () => await getInstancesOverview({}),
  ),
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
