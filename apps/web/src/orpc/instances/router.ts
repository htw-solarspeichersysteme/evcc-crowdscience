import { ORPCError, os } from "@orpc/server";
import { subSeconds } from "date-fns";
import { eq } from "drizzle-orm";
import * as z from "zod";

import { influxDb, sqliteDb } from "~/db/client";
import { instances } from "~/db/schema";
import { env } from "~/env";
import { timeRangeInputSchema } from "~/lib/globalSchemas";
import { buildFluxQuery, queryInflux } from "~/lib/influx-query";
import { generatePublicName } from "~/lib/publicNameGenerator";
import { adminProcedure, authedProcedure } from "../middleware";
import type { Gap } from "../timeSeries/types";
import { getInstancesOverview } from "./getOverview";

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
  getLatestUpdate: os
    .input(z.object({ instanceId: z.string() }))
    .handler(async ({ input }) => {
      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
          |> range(start: -1y)
          |> filter(fn: (r) => r["_measurement"] == "updated")
          |> filter(fn: (r) => r["instance"] == {{instanceId}})
          |> last()`,
        {
          bucket: env.INFLUXDB_BUCKET,
          instanceId: input.instanceId,
        },
      );
      let rows;
      try {
        rows = await influxDb.collectRows(query);
      } catch (error) {
        console.error("InfluxDB query error:", error);
        return null;
      }

      // if no data was found, return null
      if (!rows?.[0]) return null;

      const res = z.object({ _value: z.number() }).safeParse(rows?.[0]);
      if (!res.success) {
        console.error(res.error);
        return null;
      }

      return new Date(res.data._value * 1000);
    }),
  getGaps: os
    .input(
      z.object({ instanceId: z.string(), timeRange: timeRangeInputSchema }),
    )
    .handler(async ({ input }) => {
      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
          |> range(start: {{start}}, stop: {{stop}})
          |> filter(fn: (r) => r["_measurement"] == "updated")
          |> filter(fn: (r) => r["instance"] == {{instanceId}})
          |> difference()
          |> filter(fn: (r)=> r["_value"] > 40)`,
        {
          bucket: env.INFLUXDB_BUCKET,
          start: input.timeRange.start,
          stop: input.timeRange.end,
          instanceId: input.instanceId,
        },
      );

      const gaps: Gap[] = [];
      await queryInflux(
        query,
        z.object({ _time: z.coerce.date(), _value: z.number() }),
        (row) => {
          const start = subSeconds(row._time, row._value);

          if (gaps.length > 0 && gaps[gaps.length - 1].end > start) {
            gaps[gaps.length - 1].end = row._time;
            return;
          }

          gaps.push({
            start,
            end: row._time,
          });
        },
      );

      return gaps;
    }),
  setIgnored: adminProcedure
    .input(z.object({ instanceId: z.string(), ignored: z.boolean() }))
    .handler(async ({ input }) => {
      await sqliteDb
        .update(instances)
        .set({ ignored: input.ignored })
        .where(eq(instances.id, input.instanceId));
    }),
};
