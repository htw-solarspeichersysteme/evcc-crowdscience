import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const batteryRouter = createTRPCRouter({
  getTotalBatteryData: protectedProcedure.query(async ({ ctx }) => {
    const rowSchema = z.object({
      id: z.string().optional(),
      _measurement: z.enum(["batteryCapacity", "batteryEnergy", "batterySoc"]),
      _value: z.number(),
    });

    const results = new Map<
      string,
      {
        batteryCapacity: number;
        batteryEnergy: number;
        batterySoc: number;
      }
    >();

    for await (const { values, tableMeta } of ctx.influxDb.iterateRows(
      `
       from(bucket: "evcc-stats-visualizer")
       |> range(start: -30d)
       |> filter(fn: (r) => r["_measurement"] == "batteryCapacity" or r["_measurement"] == "batteryEnergy" or r["_measurement"] == "batterySoc")
       |> last()
      `,
    )) {
      const row = tableMeta.toObject(values);

      const parsedRow = rowSchema.safeParse(row);
      if (!parsedRow.success) {
        console.error(parsedRow.error);
        continue;
      }

      if (!parsedRow.data.id) continue;

      const entry = results.get(parsedRow.data.id) ?? {
        batteryCapacity: 0,
        batteryEnergy: 0,
        batterySoc: 0,
      };
      results.set(parsedRow.data.id, {
        ...entry,
        [parsedRow.data._measurement]: parsedRow.data._value,
      });
    }

    // map over results and fill empty values
    const filledEntries = Array.from(results.values()).map((entry) => {
      if (!entry.batteryCapacity && entry.batteryEnergy && entry.batterySoc) {
        entry.batteryCapacity = entry.batteryEnergy * (100 / entry.batterySoc);
      }

      if (!entry.batteryEnergy && entry.batteryCapacity && entry.batterySoc) {
        entry.batteryEnergy = entry.batteryCapacity * (entry.batterySoc / 100);
      }

      if (!entry.batterySoc && entry.batteryCapacity && entry.batteryEnergy) {
        entry.batterySoc = (entry.batteryEnergy / entry.batteryCapacity) * 100;
      }

      return entry;
    });

    return filledEntries.reduce(
      (acc, curr) => {
        acc.capacity += curr.batteryCapacity;
        acc.energy += curr.batteryEnergy;
        acc.soc += curr.batterySoc;
        return acc;
      },
      { capacity: 0, energy: 0, soc: 0 },
    );
  }),
});
