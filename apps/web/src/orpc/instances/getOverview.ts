import { env } from "bun";
import z from "zod";

import { influxDb } from "~/db/client";

export async function getInstancesOverview({
  idFilter,
}: {
  idFilter?: string;
}) {
  const instances = new Map<
    string,
    {
      id: string;
      lastUpdate?: Date;
      pvMaxPowerKw?: number;
      loadpointMaxPowerKw?: number;
    }
  >();

  const rowSchema = z.union([
    z.object({
      result: z.literal("last-update"),
      _value: z.string().or(z.number()),
      instance: z.string(),
      _measurement: z.literal("updated"),
    }),
    z
      .object({
        result: z.literal("pv-capacity"),
        _value: z.number(),
        instance: z.string(),
        _measurement: z.literal("site"),
        _field: z.literal("pvPower"),
      })
      .transform((row) => ({
        ...row,
        // convert to kW
        _value: row._value / 1000,
      })),
    z.object({
      result: z.literal("loadpoint-capacity"),
      _value: z.number(),
      instance: z.string(),
    }),
  ]);

  for await (const { values, tableMeta } of influxDb.iterateRows(
    `
        import "strings"
  
        from(bucket: "${env.INFLUXDB_BUCKET}")
          |> range(start: -30d)
          |> filter(fn: (r) => r["_measurement"] == "updated")
          |> last()
          ${idFilter ? `|> filter(fn: (r) => strings.containsStr(v: r["instance"], substr: "${idFilter}"))` : ""}
          |> yield(name: "last-update")
  
        from(bucket: "${env.INFLUXDB_BUCKET}")
          |> range(start: -365d)
          |> filter(fn: (r) => r["_measurement"] == "site")
          |> filter(fn: (r) => r["_field"] == "pvPower")
          |> max()
          ${idFilter ? `|> filter(fn: (r) => strings.containsStr(v: r["instance"], substr: "${idFilter}"))` : ""}
          |> yield(name: "pv-capacity")
  
        from(bucket: "${env.INFLUXDB_BUCKET}")
          |> range(start: -365d)
          |> filter(fn: (r) => r["_measurement"] == "loadpoints")
          |> filter(fn: (r) => r["_field"] == "effectiveMaxCurrent")
          |> last()
          ${idFilter ? `|> filter(fn: (r) => strings.containsStr(v: r["instance"], substr: "${idFilter}"))` : ""}
          |> group(columns: ["instance"])
          |> sum()
          |> yield(name: "loadpoint-capacity")
       `,
  )) {
    // make sure the row is valid
    const row = tableMeta.toObject(values);
    const { data, success, error } = rowSchema.safeParse(row);
    if (!success) {
      console.error(error);
      continue;
    }

    // use existing instance if it exists
    const instance = instances.get(data.instance) ?? { id: data.instance };

    switch (data.result) {
      case "last-update":
        instance.lastUpdate = new Date(+data._value * 1000);
        break;
      case "pv-capacity":
        instance.pvMaxPowerKw = data._value;
        break;
      case "loadpoint-capacity":
        instance.loadpointMaxPowerKw = data._value;
        break;
    }

    instances.set(data.instance, instance);
  }
  return (
    Array.from(instances.values())
      // make sure the instance was updated at least once
      .filter((instance) => Boolean(instance.lastUpdate))
      // sort by most recent update
      .sort(
        (a, b) =>
          (b.lastUpdate?.getTime() ?? 0) - (a.lastUpdate?.getTime() ?? 0),
      )
  );
}

export type InstancesOverview = Awaited<
  ReturnType<typeof getInstancesOverview>
>;
export type InstanceOverview = InstancesOverview[number];
