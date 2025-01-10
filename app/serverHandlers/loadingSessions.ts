import { createServerFn } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { subDays, subSeconds } from "date-fns";
import { router } from "react-query-kit";
import { z } from "zod";

import { influxDb } from "~/db/client";
import { env } from "~/env";
import { adminFnMiddleware, protectedFnMiddleware } from "~/globalMiddleware";
import { instancesFilterSchema } from "./instance";

export type ExtractedLoadingSessions = {
  start: Date;
  end: Date;
  componentId: string;
}[];

const extractSessionsSchema = z.object({ instanceId: z.string() });
export const extractSessions = createServerFn()
  .validator(zodValidator(extractSessionsSchema))
  .middleware([adminFnMiddleware])
  .handler(async ({ data }) => {
    const rowSchema = z.object({
      instance: z.string(),
      componentId: z.string(),
      _field: z.enum(["chargeDuration", "chargeCurrent"]),
      _value: z.number(),
      _time: z.string().pipe(z.coerce.date()),
    });

    const sessions: ExtractedLoadingSessions = [];
    const prevRows: Record<string, z.infer<typeof rowSchema>> = {};

    // this will later be used to query the latest known session from the db
    // the end time will be used as the start time for the extraction process
    // this way we dont have to query the entire history of the instance
    const latestKnownInstanceSession = { end: subDays(new Date(), 30) };

    for await (const { values, tableMeta } of influxDb.iterateRows(
      `
        from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: ${latestKnownInstanceSession.end.toISOString()})
        |> filter(fn: (r) => r["_measurement"] == "loadpoints")
        |> filter(fn: (r) => r["_field"] == "chargeDuration")
        |> filter(fn: (r) => r["instance"] == "${data.instanceId}")
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
        sessions.push({
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
    return sessions.sort((a, b) => a.start.getTime() - b.start.getTime());
  });

export const getLoadingSessionsCount = createServerFn()
  .validator(zodValidator(instancesFilterSchema))
  .middleware([protectedFnMiddleware])
  .handler(async ({}) => {
    return 0;
  });

export const loadingSessionsApi = router("loadingSessions", {
  extractSessions: router.mutation({ mutationFn: extractSessions }),
  getLoadingSessionsCount: router.query({ fetcher: getLoadingSessionsCount }),
});
