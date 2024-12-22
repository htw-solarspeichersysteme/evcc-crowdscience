import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/start";

import { influxDb } from "~/db/client";
import { env } from "~/env";
import { protectedFnMiddleware } from "~/globalMiddleware";

const getActiveInstances = createServerFn()
  .middleware([protectedFnMiddleware])
  .handler(async () => {
    const instances = new Set<string>();
    for await (const { values, tableMeta } of influxDb.iterateRows(
      `
    import "influxdata/influxdb/schema"
    schema.tagValues(bucket: "${env.INFLUXDB_BUCKET}", tag: "instance")  
     `,
    )) {
      const row = tableMeta.toObject(values);

      if (typeof row._value === "string") {
        instances.add(row._value);
      }
    }
    return Array.from(instances);
  });

export const instancesQueries = {
  getActiveInstances: () =>
    queryOptions({
      queryKey: ["instances", "getActive"],
      queryFn: () => getActiveInstances(),
    }),
};
