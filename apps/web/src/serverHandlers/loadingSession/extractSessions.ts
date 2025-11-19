import {
  differenceInMilliseconds,
  min,
  roundToNearestMinutes,
  subDays,
} from "date-fns";
import { desc, eq } from "drizzle-orm";
import * as z from "zod";

import { sqliteDb } from "~/db/client";
import { extractedLoadingSessions } from "~/db/schema";
import { env } from "~/env";
import { buildFluxQuery, queryInflux } from "~/lib/influx-query";

const interestingSessionFields = {
  max: [
    "chargePower",
    "chargedEnergy",
    "sessionEnergy",
    "phasesActive",
    "vehicleSoc",
    "vehicleRange",
    "sessionPrice",
  ],
  last: [
    "mode",
    "chargedEnergy",
    "sessionEnergy",
    "vehicleSoc",
    "vehicleRange",
    "sessionSolarPercentage",
    "sessionPrice",
  ],
  first: ["vehicleSoc", "vehicleRange", "vehicleLimitSoc"],
} as const;

export const extractSessionsSchema = z.object({ instanceId: z.string() });

export const extractSessionsHandler = async ({
  data,
}: {
  data: z.infer<typeof extractSessionsSchema>;
}) => {
  const rowSchema = z.object({
    instance: z.string(),
    componentId: z.string(),
    _field: z.string(),
    _value: z.number(),
    _time: z.string().pipe(z.coerce.date()),
    result: z.string(),
  });

  const sessionsTimes: {
    startTime: Date;
    endTime: Date;
    componentId: string;
    duration: number;
  }[] = [];
  const previousData: Record<
    string,
    {
      min: z.infer<typeof rowSchema>;
      max: z.infer<typeof rowSchema>;
      potentialSessionStartTime: Date | null;
      mode: "minpv" | "pv" | "now" | null;
      maxChargePower: number | null;
      chargedEnergy: number | null;
    }
  > = {};

  // this is used to query the latest known session from the db
  // the end time will be used as the start time for the extraction process
  // this way we dont have to query the entire history of the instance
  const latestKnownInstanceSessions = await sqliteDb
    .select({
      componentId: extractedLoadingSessions.componentId,
      endTime: extractedLoadingSessions.endTime,
    })
    .from(extractedLoadingSessions)
    .where(eq(extractedLoadingSessions.instanceId, data.instanceId))
    .orderBy(desc(extractedLoadingSessions.endTime))
    .groupBy(extractedLoadingSessions.componentId)
    .limit(1);

  // find the start time of the last session for each component
  // the earliest start time will be the start time for the extraction process
  const rangeStart = min([
    ...latestKnownInstanceSessions.map((session) => session.endTime),
    subDays(new Date(), 10),
  ]);

  const query = buildFluxQuery(
    `
        from(bucket: {{bucket}})
        |> range(start: {{rangeStart}})
        |> filter(fn: (r) => r["_measurement"] == "loadpoints")
        |> filter(fn: (r) => r["_field"] == "chargeDuration")
        |> filter(fn: (r) => r["instance"] == {{instanceId}})
        |> aggregateWindow(every: 1m, fn: max, createEmpty: false)
        |> yield(name: "max")

        from(bucket: {{bucket}})
        |> range(start: {{rangeStart}})
        |> filter(fn: (r) => r["_measurement"] == "loadpoints")
        |> filter(fn: (r) => r["_field"] == "chargeDuration")
        |> filter(fn: (r) => r["instance"] == {{instanceId}})
        |> aggregateWindow(every: 1m, fn: min, createEmpty: false)
        |> yield(name: "min")
        `,
    {
      bucket: env.INFLUXDB_BUCKET,
      rangeStart: rangeStart ?? subDays(new Date(), 30),
      instanceId: data.instanceId,
    },
  );

  await queryInflux(query, rowSchema, (row) => {
    if (!previousData[row.componentId]) {
      previousData[row.componentId] = {
        min: row,
        max: row,
        potentialSessionStartTime: null,
        mode: null,
        maxChargePower: null,
        chargedEnergy: null,
      };
    }
    const previousComponentData = previousData[row.componentId];

    if (
      previousComponentData &&
      previousComponentData.potentialSessionStartTime !== null &&
      (previousComponentData.min._value > row._value ||
        previousComponentData.max._value > row._value)
    ) {
      // we dont want sessions that are less than 1 minute
      if (
        previousComponentData.max._value > 60 &&
        differenceInMilliseconds(
          previousComponentData.max._time,
          previousComponentData.potentialSessionStartTime,
        ) >
          1000 * 10
      ) {
        sessionsTimes.push({
          endTime: previousComponentData.max._time,
          startTime: previousComponentData.potentialSessionStartTime,
          duration: previousComponentData.max._value,
          componentId: row.componentId,
        });
      }

      previousData[row.componentId] = {
        min: {
          ...row,
          _value: 0,
        },
        max: {
          ...row,
          _value: 0,
        },
        potentialSessionStartTime: null,
        mode: null,
        maxChargePower: null,
        chargedEnergy: null,
      };
    }

    if (row.result === "min") {
      previousComponentData.min = row;
    } else {
      previousComponentData.max = row;
    }

    if (
      previousComponentData.potentialSessionStartTime === null &&
      row.result === "max" &&
      row._value > 0
    ) {
      previousComponentData.potentialSessionStartTime = row._time;
    }
  });

  // session times are now extracted, now we need to extract the charge power and energy
  // we need to do this for each session time
  const extractedSessions: ExtractedSession[] = [];

  const sessionDataRowSchema = z.object({
    _field: z.string(),
    _value: z.union([z.number(), z.string(), z.boolean(), z.null()]),
    _time: z.string().pipe(z.coerce.date()),
    result: z.enum(["min", "first", "last", "max"]),
  });

  for (const session of sessionsTimes) {
    const extractedFields: ExtractedSession["data"] = {};

    for (const [type, fields] of Object.entries(interestingSessionFields)) {
      // Build field filter conditions - these are safe as they come from a const array
      const fieldFilters = fields
        .map((field) => `r["_field"] == "${field}"`)
        .join(" or ");

      const query = buildFluxQuery(
        `
          from(bucket: {{bucket}})
            |> range(start: {{startTime}}, stop: {{endTime}})
            |> filter(fn: (r) => r["_measurement"] == "loadpoints"
                  and r["instance"] == {{instanceId}}
                  and r["componentId"] == {{componentId}}
                  and (${fieldFilters})
                )
            |> ${type}()
            |> yield(name: "${type}")
        `,
        {
          bucket: env.INFLUXDB_BUCKET,
          startTime: session.startTime,
          endTime: session.endTime,
          instanceId: data.instanceId,
          componentId: session.componentId,
        },
      );

      await queryInflux(query, sessionDataRowSchema, (row) => {
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        extractedFields[row.result] = {
          // @ts-expect-error
          ...extractedFields[row.result],
          [row._field]: row._value,
        };
      });
    }

    extractedSessions.push({
      ...session,
      data: extractedFields,
    });
  }

  return extractedSessions.sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
};

export type ExtractedSessions = Awaited<
  ReturnType<typeof extractSessionsHandler>
>;

function generateSessionId(session: ExtractedSession, instanceId: string) {
  return String(
    Bun.hash(
      JSON.stringify({
        instanceId,
        componentId: session.componentId,
        duration: session.duration,
        startTime: roundToNearestMinutes(session.startTime, {
          nearestTo: 5,
        }),
        endTime: roundToNearestMinutes(session.endTime, {
          nearestTo: 5,
        }),
      }),
    ),
  );
}

export const extractAndSaveSessions = async (instanceId: string) => {
  const instanceSessions = await extractSessionsHandler({
    data: { instanceId },
  });

  if (instanceSessions.length)
    await sqliteDb
      .insert(extractedLoadingSessions)
      .values(
        // @ts-expect-error - not all the fields are typed correctly, it's ok
        instanceSessions.map((session) => ({
          id: generateSessionId(session, instanceId),
          instanceId,
          componentId: session.componentId,
          duration: session.duration,
          endTime: session.endTime,
          startTime: session.startTime,
          // the rest are fields that will only maybe be there
          startSoc: session.data.first?.vehicleSoc,
          endSoc: session.data.max?.vehicleSoc,
          startRange: session.data.first?.vehicleRange,
          endRange: session.data.max?.vehicleRange,
          limitSoc: session.data.first?.vehicleLimitSoc,
          chargedEnergy: session.data.max?.chargedEnergy,
          sessionEnergy: session.data.max?.sessionEnergy,
          maxChargePower: session.data.max?.chargePower,
          maxPhasesActive: session.data.max?.phasesActive,
          mode: session.data.last?.mode,
          price: session.data.max?.sessionPrice,
          solarPercentage: session.data.last?.sessionSolarPercentage,
        })),
      )
      .onConflictDoNothing();

  const savedSessions = await sqliteDb
    .select()
    .from(extractedLoadingSessions)
    .where(eq(extractedLoadingSessions.instanceId, instanceId));

  return { extracted: instanceSessions, saved: savedSessions };
};

type InterestingFields = typeof interestingSessionFields;
type GroupTypes = keyof InterestingFields;
type FieldsByGroup<G extends GroupTypes> = InterestingFields[G][number];

export type ExtractedSession = {
  startTime: Date;
  endTime: Date;
  componentId: string;
  duration: number;
  data: Partial<{
    [G in GroupTypes]: Record<
      FieldsByGroup<G>,
      number | string | boolean | null
    >;
  }>;
};
