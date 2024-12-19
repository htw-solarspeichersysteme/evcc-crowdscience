import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/start";

import { influxDb } from "~/db/client";

const getActiveInstances = createServerFn().handler(async () => {
  const instances = new Set<string>();
  for await (const { values, tableMeta } of influxDb.iterateRows(
    `
    import "influxdata/influxdb/schema"
    schema.tagValues(bucket: "evcc-input-v1", tag: "instance")  
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
