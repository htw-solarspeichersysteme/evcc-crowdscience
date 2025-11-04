import { os } from "@orpc/server";
import { z } from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import type { BatteryMetaData } from "./types";

const batteryMetadataRowSchema = z.object({
  _field: z
    .enum(["capacity", "energy", "soc", "power", "controllable"])
    .or(z.string()),
  _value: z.union([z.number(), z.boolean(), z.string()]),
  _time: z.string().transform((v) => new Date(v)),
  componentId: z.string(),
});

export const batteriesRouter = {
  getMetaData: os
    .input(z.object({ instanceId: z.string() }))
    .handler(async ({ input }) => {
      const rows = await influxDb.collectRows(
        `from(bucket: "${env.INFLUXDB_BUCKET}")
          |> range(start: -${instanceCountsAsActiveDays}d)
          |> filter(fn: (r) => r["_measurement"] == "battery")
          |> filter(fn: (r) => r["instance"] == "${input.instanceId}")
          |> last()
       `,
      );
      const res = batteryMetadataRowSchema
        .transform((original) => ({
          field: original._field,
          value: original._value,
          lastUpdate: original._time,
          componentId: original.componentId,
        }))
        .array()
        .safeParse(rows);

      if (!res.success) {
        console.error(res.error);
        return {};
      }

      return res.data.reduce((acc, item) => {
        if (!acc[item.componentId]) {
          acc[item.componentId] = {};
        }
        acc[item.componentId][item.field] = {
          value: item.value,
          lastUpdate: item.lastUpdate,
        };
        return acc;
      }, {} as BatteryMetaData);
    }),
  getData: os
    .input(
      z
        .object({
          calculateMissingValues: z.boolean().optional().prefault(false),
        })
        .prefault({}),
    )
    .handler(async ({ input }) => {
      const baseSchema = z.object({
        componentId: z.string(),
        instance: z.string(),
      });

      const rowSchema = baseSchema.extend(batteryMetadataRowSchema.shape).or(
        baseSchema.extend(
          z.object({
            _field: z.enum(["controllable"]),
            _value: z.boolean(),
          }).shape,
        ),
      );

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

      for await (const { values, tableMeta } of influxDb.iterateRows(
        `
          from(bucket: "${env.INFLUXDB_BUCKET}")
           |> range(start: -${instanceCountsAsActiveDays}d)
           |> filter(fn: (r) => r["_measurement"] == "battery")
           |> last()
          `,
      )) {
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

      if (input.calculateMissingValues) {
        // go through data and calculate in missing values (soc, energy, capacity)
        // dont change the shape of the data
        Object.entries(res).forEach(([_, components]) => {
          Object.entries(components).forEach(([_, values]) => {
            if (!values.capacity && values.energy && values.soc) {
              values.capacity = values.energy * (100 / values.soc);
            }
            if (!values.energy && values.capacity && values.soc) {
              values.energy = values.capacity * (values.soc / 100);
            }
            if (!values.soc && values.capacity && values.energy) {
              values.soc = (values.energy / values.capacity) * 100;
            }
          });
        });
      }

      return res;
    }),
};
