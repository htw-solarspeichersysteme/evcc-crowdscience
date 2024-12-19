import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

// import { influxDb } from "~/db/client";

const instancesFilterSchema = z
  .object({
    ids: z.array(z.string()).optional(),
  })
  .optional();

const getTotalBatteryData = createServerFn()
  .validator(zodValidator(instancesFilterSchema))
  .handler(async () => {
    // const rowSchema = z.object({
    //   componentId: z.string(),
    //   field: z.enum(["capacity", "energy", "controllable", "power", "soc"]),
    //   _value: z.number(),
    // });

    // const results = new Map<
    //   string,
    //   {
    //     batteryCapacity: number;
    //     batteryEnergy: number;
    //     batterySoc: number;
    //   }
    // >();

    // for await (const { values, tableMeta } of influxDb.iterateRows(
    //   `
    //      from(bucket: "evcc-input-v1")
    //      |> range(start: -1h)
    //      |> filter(fn: (r) => r["_measurement"] == "battery")
    //      |> last()
    //     `,
    // )) {
    //   const row = tableMeta.toObject(values);
    //   console.log(row);
    // }

    //   const parsedRow = rowSchema.safeParse(row);
    //   if (!parsedRow.success) {
    //     console.error(parsedRow.error);
    //     continue;
    //   }

    //   if (!parsedRow.data.id) continue;

    //   const entry = results.get(parsedRow.data.id) ?? {
    //     batteryCapacity: 0,
    //     batteryEnergy: 0,
    //     batterySoc: 0,
    //   };
    //   results.set(parsedRow.data.id, {
    //     ...entry,
    //     [parsedRow.data._measurement]: parsedRow.data._value,
    //   });
    // }

    // // map over results and fill empty values
    // const filledEntries = Array.from(results.values()).map((entry) => {
    //   if (!entry.batteryCapacity && entry.batteryEnergy && entry.batterySoc) {
    //     entry.batteryCapacity = entry.batteryEnergy * (100 / entry.batterySoc);
    //   }

    //   if (!entry.batteryEnergy && entry.batteryCapacity && entry.batterySoc) {
    //     entry.batteryEnergy = entry.batteryCapacity * (entry.batterySoc / 100);
    //   }

    //   if (!entry.batterySoc && entry.batteryCapacity && entry.batteryEnergy) {
    //     entry.batterySoc = (entry.batteryEnergy / entry.batteryCapacity) * 100;
    //   }

    //   return entry;
    // });

    // return filledEntries.reduce(
    //   (acc, curr) => {
    //     acc.capacity += curr.batteryCapacity;
    //     acc.energy += curr.batteryEnergy;
    //     acc.soc += curr.batterySoc;
    //     return acc;
    //   },
    //   { capacity: 0, energy: 0, soc: 0 },
    // );

    return {
      capacity: 13,
      energy: 12,
      soc: 14,
    };
  });

export const batteryQueries = {
  getTotalBatteryData: () =>
    queryOptions({
      queryKey: ["battery", "getTotalBatteryData"],
      queryFn: () => getTotalBatteryData(),
    }),
};
