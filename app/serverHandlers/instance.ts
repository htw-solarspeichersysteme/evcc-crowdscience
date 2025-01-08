import { createServerFn } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { router } from "react-query-kit";
import { z } from "zod";

import { influxDb } from "~/db/client";
import { env } from "~/env";
import { protectedFnMiddleware } from "~/globalMiddleware";

export const instancesFilterSchema = z.object({
  instanceIds: z.array(z.string()).optional(),
});

const getActiveInstances = createServerFn()
  .middleware([protectedFnMiddleware])
  .handler(async () => {
    const instances = new Map<string, { id: string }>();
    for await (const { values, tableMeta } of influxDb.iterateRows(
      `
    import "influxdata/influxdb/schema"
    schema.tagValues(bucket: "${env.INFLUXDB_BUCKET}", tag: "instance")  
     `,
    )) {
      const row = tableMeta.toObject(values);

      if (typeof row._value === "string") {
        instances.set(row._value, { id: row._value });
      }
    }
    return Array.from(instances.values());
  });

export const generateInstanceId = createServerFn().handler(async () => {
  const instanceId = Bun.randomUUIDv7();

  return instanceId;
});

export const isInstanceActive = createServerFn()
  .validator(zodValidator(z.object({ instanceId: z.string() })))
  .handler(async ({ data }) => {
    for await (const { values, tableMeta } of influxDb.iterateRows(
      `
      from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: -30d)
        |> filter(fn: (r) => r["instance"] == "${data.instanceId}")
        |> count(column: "_value")
     `,
    )) {
      const row = tableMeta.toObject(values);
      if (row.instance === data.instanceId) {
        return true;
      }
    }

    return false;
  });

export const instanceApi = router("instance", {
  getActiveInstances: router.query({ fetcher: getActiveInstances }),
  isInstanceActive: router.query({ fetcher: isInstanceActive }),
  generateInstanceId: router.mutation({ mutationFn: generateInstanceId }),
});
