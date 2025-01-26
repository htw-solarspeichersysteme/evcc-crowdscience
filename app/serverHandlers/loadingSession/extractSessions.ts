import { subDays, subSeconds } from "date-fns";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { influxDb, sqliteDb } from "~/db/client";
import { extractedLoadingSessions } from "~/db/schema";
import { env } from "~/env";

export const extractSessionsSchema = z.object({ instanceId: z.string() });

export const extractSessionsHandler = async ({
  data,
}: {
  data: z.infer<typeof extractSessionsSchema>;
}) => {
  const rowSchema = z.object({
    instance: z.string(),
    componentId: z.string(),
    _field: z.enum(["chargeDuration", "chargeCurrent"]),
    _value: z.number(),
    _time: z.string().pipe(z.coerce.date()),
  });

  const sessions: {
    startTime: Date;
    endTime: Date;
    componentId: string;
    duration: number;
  }[] = [];
  const prevRows: Record<string, z.infer<typeof rowSchema>> = {};

  // this will later be used to query the latest known session from the db
  // the end time will be used as the start time for the extraction process
  // this way we dont have to query the entire history of the instance
  //   const latestKnownInstanceSession = { end: subDays(new Date(), 30) };
  const latestKnownInstanceSessions = await sqliteDb
    .select()
    .from(extractedLoadingSessions)
    .where(eq(extractedLoadingSessions.instanceId, data.instanceId))
    .orderBy(desc(extractedLoadingSessions.endTime))
    .limit(1);

  const latestEnd = latestKnownInstanceSessions[0]?.endTime;

  for await (const { values, tableMeta } of influxDb.iterateRows(
    `
        from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: ${latestEnd ? latestEnd.toISOString() : subDays(new Date(), 30).toISOString()})
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
        endTime: prevRows[row.instance]._time,
        startTime: subSeconds(
          prevRows[row.instance]._time,
          prevRows[row.instance]._value,
        ),
        duration: prevRows[row.instance]._value,
        componentId: row.componentId,
      });

      prevRows[row.instance] = {
        ...row,
        _value: 0,
      };
    }

    prevRows[row.instance] = row;
  }
  return sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
};
