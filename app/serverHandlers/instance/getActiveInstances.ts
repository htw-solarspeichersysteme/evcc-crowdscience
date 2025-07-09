"use server";

import { z } from "zod";

import { influxDb } from "~/db/client";
import { env } from "~/env";
import { instancesFilterSchema } from "~/lib/globalSchemas";

export const getActiveInstancesSchema = z
  .object({
    filter: instancesFilterSchema.optional(),
  })
  .default({});

export const getActiveInstancesHandler = async ({
  data,
}: {
  data?: { instanceId: string };
}) => {
  const rowSchema = z
    .object({
      result: z.literal("last-update"),
      _value: z.string().or(z.number()),
      instance: z.string(),
      _measurement: z.literal("updated"),
    })
    .or(
      z
        .object({
          result: z.literal("max-pv-power"),
          _value: z.number(),
          instance: z.string(),
          _measurement: z.literal("site"),
          _field: z.literal("pvPower"),
        })
        .transform((r) => ({
          ...r,
          _value: r._value / 1000,
        })),
    )
    .or(
      z.object({
        result: z.literal("max-loadpoint-power"),
        _value: z.number(),
        instance: z.string(),
      }),
    );

  const end = new Date();

  const instances = new Map<
    string,
    {
      id: string;
      lastUpdate?: Date;
      pvPower?: number;
      loadpointPower?: number;
    }
  >();
  for await (const { values, tableMeta } of influxDb.iterateRows(
    `
      import "strings"

      from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: -30d, stop: ${end.toISOString()})
        |> filter(fn: (r) => r["_measurement"] == "updated")
        |> last()
        ${data?.instanceId ? `|> filter(fn: (r) => strings.containsStr(v: r["instance"], substr: "${data.instanceId}"))` : ""}
        |> yield(name: "last-update")

      from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: -365d, stop: ${end.toISOString()})
        |> filter(fn: (r) => r["_measurement"] == "site")
        |> filter(fn: (r) => r["_field"] == "pvPower")
        |> max()
        |> yield(name: "max-pv-power")

      from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: -365d)
        |> filter(fn: (r) => r["_measurement"] == "loadpoints")
        |> filter(fn: (r) => r["_field"] == "maxCurrent")
        |> last()
        |> group(columns: ["instance"])
        |> sum()
        |> yield(name: "max-loadpoint-power")
     `,
  )) {
    const row = tableMeta.toObject(values);
    const parsedRow = rowSchema.safeParse(row);
    if (!parsedRow.success) continue;

    // add instance if it doesn't exist
    if (!instances.has(parsedRow.data.instance)) {
      instances.set(parsedRow.data.instance, {
        id: parsedRow.data.instance,
      });
    }

    if (parsedRow.data.result === "last-update") {
      instances.get(parsedRow.data.instance)!.lastUpdate = new Date(
        +parsedRow.data._value * 1000,
      );
    } else if (parsedRow.data.result === "max-pv-power") {
      instances.get(parsedRow.data.instance)!.pvPower = parsedRow.data._value;
    } else if (parsedRow.data.result === "max-loadpoint-power") {
      instances.get(parsedRow.data.instance)!.loadpointPower =
        parsedRow.data._value;
    }
  }

  return (
    Array.from(instances.values())
      .filter((i) => Boolean(i.lastUpdate))
      // sort by most recent update
      .sort(
        (a, b) =>
          (b.lastUpdate?.getTime() ?? 0) - (a.lastUpdate?.getTime() ?? 0),
      )
  );
};
