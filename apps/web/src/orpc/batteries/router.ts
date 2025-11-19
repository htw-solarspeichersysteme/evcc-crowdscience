import { os } from "@orpc/server";
import * as z from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { buildFluxQuery } from "~/lib/influx-query";
import { influxRowBaseSchema, type MetaData } from "../types";

const batteryMetadataRowSchema = influxRowBaseSchema.extend({
  _field: z
    .enum(["capacity", "energy", "soc", "power", "controllable"])
    .or(z.string()),
  _value: z.union([z.number(), z.boolean(), z.string()]),
  componentId: z.string().optional(),
});

export const batteriesRouter = {
  getMetaData: os
    .input(z.object({ instanceId: z.string() }))
    .handler(async ({ input }): Promise<MetaData> => {
      const metaData: MetaData = { values: {}, count: 0 };

      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
          |> range(start: {{rangeStart}})
          |> filter(fn: (r) => r["_measurement"] == "battery")
          |> filter(fn: (r) => r["instance"] == {{instanceId}})
          |> last()`,
        {
          bucket: env.INFLUXDB_BUCKET,
          rangeStart: `-${instanceCountsAsActiveDays}d`,
          instanceId: input.instanceId,
        },
      );
      let rows;
      try {
        rows = await influxDb.collectRows(query);
      } catch (error) {
        console.error("InfluxDB query error:", error);
        return metaData;
      }
      const res = batteryMetadataRowSchema.array().safeParse(rows);

      if (!res.success) {
        console.error(res.error);
        return metaData;
      }

      for (const item of res.data) {
        if (item._field === "count") metaData.count = Number(item._value);
        if (!item.componentId) continue;
        metaData.values[item.componentId] ??= {};
        metaData.values[item.componentId][item._field] = {
          value: item._value,
          lastUpdate: item._time,
        };
      }

      if (metaData.count === 0)
        metaData.count = Object.keys(metaData.values).length;

      return metaData;
    }),
  getData: os.handler(async () => {
    const rowSchema = z.object({
      componentId: z.string(),
      instance: z.string(),
      _field: z
        .enum(["capacity", "energy", "soc", "power", "controllable"])
        .or(z.string()),
      _value: z.union([z.number(), z.boolean(), z.string()]),
      _time: z.string().transform((v) => new Date(v)),
    });

    const res: Record<
      string,
      Record<
        string,
        Partial<{
          capacity: number;
          energy: number;
          soc: number;
          controllable: boolean;
          power: number;
        }>
      >
    > = {};

    const query = buildFluxQuery(
      `from(bucket: {{bucket}})
        |> range(start: {{rangeStart}})
        |> filter(fn: (r) => r["_measurement"] == "battery")
        |> last()`,
      {
        bucket: env.INFLUXDB_BUCKET,
        rangeStart: `-${instanceCountsAsActiveDays}d`,
      },
    );

    try {
      for await (const { values, tableMeta } of influxDb.iterateRows(query)) {
        const row = tableMeta.toObject(values);

        const parsedRow = rowSchema.safeParse(row);
        if (!parsedRow.success) {
          console.error(parsedRow.error);
          continue;
        }

        if (!res[parsedRow.data.instance]) {
          res[parsedRow.data.instance] = {};
        }

        if (!res[parsedRow.data.instance][parsedRow.data.componentId]) {
          res[parsedRow.data.instance][parsedRow.data.componentId] = {};
        }

        //@ts-expect-error problem with assignment to partial and field types
        // but zod makes sure that the field is valid
        res[parsedRow.data.instance][parsedRow.data.componentId][
          parsedRow.data._field
        ] = parsedRow.data._value;
      }
    } catch (error) {
      console.error("InfluxDB query error:", error);
      return res;
    }

    return res;
  }),
};
