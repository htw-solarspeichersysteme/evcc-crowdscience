import { createServerFn } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { subSeconds } from "date-fns";
import { z } from "zod";

import { influxDb } from "~/db/client";
import { env } from "~/env";
import { adminFnMiddleware } from "~/globalMiddleware";
import { instancesFilterSchema } from "./instance";

export type ExtractedLoadingSessions = Record<
  string,
  Array<{
    start: Date;
    end: Date;
    componentId: string;
  }>
>;

export const extractSessions = createServerFn()
  .validator(zodValidator(instancesFilterSchema))
  .middleware([adminFnMiddleware])
  .handler(async () => {
    const rowSchema = z.object({
      instance: z.string(),
      componentId: z.string(),
      _field: z.enum(["chargeDuration", "chargeCurrent"]),
      _value: z.number(),
      _time: z.string().pipe(z.coerce.date()),
    });

    const sessions: ExtractedLoadingSessions = {};
    const prevRows: Record<string, z.infer<typeof rowSchema>> = {};

    for await (const { values, tableMeta } of influxDb.iterateRows(
      `
        from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: -5d)
        |> filter(fn: (r) => r["_measurement"] == "loadpoints")
        |> filter(fn: (r) => r["_field"] == "chargeDuration")
        |> aggregateWindow(every: 1m, fn: max, createEmpty: false)
        |> yield(name: "max")
        `,
    )) {
      const parseResult = rowSchema.safeParse(tableMeta.toObject(values));
      if (!parseResult.success) {
        console.error(parseResult.error);
        continue;
      }

      const row = parseResult.data;

      if (
        row._value > 1 &&
        prevRows[row.instance] &&
        prevRows[row.instance]._value > row._value
      ) {
        if (!sessions[row.instance]) sessions[row.instance] = [];

        sessions[row.instance].push({
          end: prevRows[row.instance]._time,
          start: subSeconds(
            prevRows[row.instance]._time,
            prevRows[row.instance]._value,
          ),
          componentId: row.componentId,
        });

        prevRows[row.instance] = {
          ...row,
          _value: 0,
        };
      }

      prevRows[row.instance] = row;
    }
    return sessions;
  });
