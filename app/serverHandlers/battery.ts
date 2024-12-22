import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { influxDb } from "~/db/client";
import { env } from "~/env";
import { protectedFnMiddleware } from "~/globalMiddleware";

const instancesFilterSchema = z.object({
  instanceIds: z.array(z.string()).optional(),
});

const getBatteryDataInputSchema = instancesFilterSchema.merge(
  z.object({
    calculateMissingValues: z.boolean().optional().default(true),
  }),
);

const getBatteryData = createServerFn()
  .middleware([protectedFnMiddleware])
  .validator(zodValidator(getBatteryDataInputSchema))
  .handler(async ({ data }) => {
    const baseSchema = z.object({
      componentId: z.string(),
      instance: z.string(),
    });

    const rowSchema = baseSchema
      .merge(
        z.object({
          _field: z.enum(["capacity", "energy", "power", "soc", "power"]),
          _value: z.number(),
        }),
      )
      .or(
        baseSchema.merge(
          z.object({
            _field: z.enum(["controllable"]),
            _value: z.boolean(),
          }),
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
         |> range(start: -30d)
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

    if (data.calculateMissingValues) {
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
  });

export const batteryQueries = {
  getBatteryData: (input: z.input<typeof getBatteryDataInputSchema>) =>
    queryOptions({
      queryKey: ["battery", "getBatteryData"],
      queryFn: () => getBatteryData({ data: input }),
    }),
};
