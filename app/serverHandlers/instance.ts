import { createServerFn } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { router } from "react-query-kit";
import { z } from "zod";

import {
  instanceCountsAsActiveDays,
  possibleInstanceTimeSeriesMetrics,
} from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { protectedFnMiddleware } from "~/globalMiddleware";

export const instancesFilterSchema = z.object({
  instanceIds: z.array(z.string()).optional(),
});

const getActiveInstances = createServerFn()
  .validator(
    zodValidator(z.object({ range: z.string().optional() }).default({})),
  )
  .middleware([protectedFnMiddleware])
  .handler(async ({ data }) => {
    const instances = new Map<string, { id: string; lastUpdate: Date }>();
    for await (const { values, tableMeta } of influxDb.iterateRows(
      `from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: ${data.range ?? `-${instanceCountsAsActiveDays}d`})
        |> filter(fn: (r) => r["_measurement"] == "updated")
        |> last()
     `,
    )) {
      const row = tableMeta.toObject(values);

      if (typeof row.instance === "string" && typeof row._value === "string") {
        instances.set(row.instance, {
          id: row.instance,
          lastUpdate: new Date(parseInt(row._value) * 1000),
        });
      }
    }
    return Array.from(instances.values());
  });

export const generateInstanceId = createServerFn().handler(async () => {
  const instanceId = Bun.randomUUIDv7();

  return instanceId;
});

export const getLatestInstanceUpdate = createServerFn()
  .validator(
    zodValidator(
      z.object({
        instanceId: z.string(),
        hasToBeRecent: z.boolean().default(false),
      }),
    ),
  )
  .handler(async ({ data }) => {
    const rows = await influxDb.collectRows(
      `from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: ${data.hasToBeRecent ? "-3m" : "-1y"})
        |> filter(fn: (r) => r["_measurement"] == "updated")
        |> filter(fn: (r) => r["instance"] == "${data.instanceId}")
        |> last()
     `,
    );

    // make sure it has the correct shape
    const res = z.object({ _value: z.string() }).safeParse(rows?.[0]);
    if (!res.success) return null;

    return new Date(parseInt(res.data._value) * 1000);
  });

export const getTimeSeriesData = createServerFn()
  .validator(
    zodValidator(
      z.object({
        metric: z.enum(possibleInstanceTimeSeriesMetrics),
        instanceId: z.string(),
      }),
    ),
  )
  .handler(async ({ data }) => {
    const res = [];

    const rowSchema = z
      .object({
        _value: z.union([z.number(), z.string()]),
        _time: z.string(),
      })
      .transform((r) => ({
        value: r._value,
        time: r._time,
      }));
    for await (const { values, tableMeta } of influxDb.iterateRows(
      `from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: -3d)
        |> filter(fn: (r) => r["instance"] == "${data.instanceId}")
        |> filter(fn: (r) => r["_field"] == "${data.metric}")
        |> aggregateWindow(every: 1h, fn: last, createEmpty: false)
        |> yield(name: "last")
     `,
    )) {
      const row = tableMeta.toObject(values);
      const parsedRow = rowSchema.parse(row);
      res.push(parsedRow);
    }
    return res;
  });

export const instanceApi = router("instance", {
  getActiveInstances: router.query({ fetcher: getActiveInstances }),
  getLatestInstanceUpdate: router.query({
    fetcher: getLatestInstanceUpdate,
  }),
  generateInstanceId: router.mutation({ mutationFn: generateInstanceId }),
  getTimeSeriesData: router.query({ fetcher: getTimeSeriesData }),
});
