import { subSeconds } from "date-fns";
import z from "zod";

import { env } from "~/env";
import { buildFluxQuery, queryInflux } from "~/lib/influx-query";
import type { ExtractedSessionRange } from "./types";

export async function extractSessionRanges({
  instanceId,
  timeRange,
}: {
  instanceId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
}) {
  const rowSchema = z.object({
    _value: z.number(),
    _time: z.coerce.date(),
    componentId: z.string(),
  });

  const query = buildFluxQuery(
    `from(bucket: {{bucket}})
        |> range(start: {{start}}, stop: {{end}})
        |> filter(fn: (r) => r["_measurement"] == "loadpoints")
        |> filter(fn: (r) => r["_field"] == "chargeDuration")
        |> filter(fn: (r) => r["instance"] == {{instanceId}})
        |> yield(name: "chargeDuration")`,
    {
      bucket: env.INFLUXDB_BUCKET,
      start: timeRange.start,
      end: timeRange.end,
      instanceId: instanceId,
    },
  );

  const extractedSessionRanges: ExtractedSessionRange[] = [];

  const results = new Map<
    string,
    {
      startTime?: Date;
      endTime?: Date;
      duration: number;
    }
  >();

  await queryInflux(query, rowSchema, (row) => {
    const activeSession = results.get(row.componentId);

    if (!activeSession) {
      results.set(row.componentId, {
        duration: row._value,
      });

      return;
    }

    if (row._value < activeSession.duration) {
      if (activeSession.startTime && activeSession.endTime) {
        extractedSessionRanges.push({
          componentId: row.componentId,
          startTime: activeSession.startTime,
          endTime: activeSession.endTime,
          duration: activeSession.duration,
        });
        results.delete(row.componentId);
      }

      if (row._value < 300) {
        results.set(row.componentId, {
          duration: row._value,
          startTime: subSeconds(row._time, row._value),
          endTime: row._time,
        });
        return;
      }
    }

    if (row._value > activeSession.duration) {
      activeSession.duration = row._value;
      activeSession.endTime = row._time;
      return;
    }
  });

  return extractedSessionRanges;
}
