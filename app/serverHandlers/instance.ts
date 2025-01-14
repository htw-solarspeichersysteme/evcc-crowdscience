import { createServerFn } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { humanId } from "human-id";
import { router } from "react-query-kit";
import { z } from "zod";

import {
  instanceCountsAsActiveDays,
  possibleInstanceTimeSeriesMetrics,
} from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { protectedFnMiddleware } from "~/globalMiddleware";
import { getInstancesQueryMiddleware } from "~/hooks/use-instances-filter";
import { instancesFilterSchema } from "~/lib/globalSchemas";

export const getActiveInstancesSchema = z.object({
  filter: instancesFilterSchema.optional(),
});

export const getActiveInstances = createServerFn()
  .validator(zodValidator(getActiveInstancesSchema))
  .middleware([protectedFnMiddleware])
  .handler(async ({ data }) => {
    const instances = new Map<string, { id: string; lastUpdate: Date }>();
    for await (const { values, tableMeta } of influxDb.iterateRows(
      `
      import "strings"

      from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: ${data?.filter?.updatedWithinHours ? `-${data.filter.updatedWithinHours}h` : `-${instanceCountsAsActiveDays}d`})
        |> filter(fn: (r) => r["_measurement"] == "updated")
        |> last()
        ${data?.filter?.id ? `|> filter(fn: (r) => strings.containsStr(v: r["instance"], substr: "${data.filter.id}"))` : ""}
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
    // sort by most recent update
    return Array.from(instances.values()).sort(
      (a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime(),
    );
  });

export const generateInstanceId = createServerFn().handler(async () => {
  const instanceId = humanId({
    separator: "-",
    capitalize: false,
  });

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
  getActiveInstances: router.query({
    fetcher: getActiveInstances,
    use: [getInstancesQueryMiddleware],
  }),
  getLatestInstanceUpdate: router.query({
    fetcher: getLatestInstanceUpdate,
  }),
  generateInstanceId: router.mutation({ mutationFn: generateInstanceId }),
  getTimeSeriesData: router.query({ fetcher: getTimeSeriesData }),
});
