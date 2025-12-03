import z from "zod";

import { env } from "~/env";
import { buildFluxQuery, queryInflux } from "~/lib/influx-query";
import { authedProcedure } from "../middleware";
import { interestingSessionFields } from "./extractRanges";
import { generateSessionRangeHash } from "./helpers";
import {
  extractedSessionRangeSchema,
  extractedSessionSchema,
  type ExtractedFields,
} from "./types";

function coerceToNumber(
  value: number | string | boolean | null | undefined,
): number | null | undefined {
  if (value === null || value === undefined) return value;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  }
  return null;
}

function coerceToString(
  value: number | string | boolean | null | undefined,
): string | null | undefined {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value;
  return String(value);
}

export const extractSessionDetails = authedProcedure
  .input(extractedSessionRangeSchema)
  .output(extractedSessionSchema.nullable())
  .handler(async ({ input }) => {
    const queries: string[] = [];
    for (const [type, fields] of Object.entries(interestingSessionFields)) {
      const fieldFilters = fields
        .map((field) => `r["_field"] == "${field}"`)
        .join(" or ");

      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
        |> range(start: {{start}}, stop: {{end}})
        |> filter(fn: (r) => r["_measurement"] == "loadpoints")
        |> filter(fn: (r) => ${fieldFilters})
        |> filter(fn: (r) => r["componentId"] == {{componentId}})
        |> filter(fn: (r) => r["instance"] == {{instanceId}})
        |> ${type}()
        |> yield(name: "${type}")`,
        {
          bucket: env.INFLUXDB_BUCKET,
          start: input.startTime,
          end: input.endTime,
          instanceId: input.instanceId,
          componentId: input.componentId,
        },
      );
      queries.push(query);
    }

    const extractedFields: ExtractedFields = {};

    await queryInflux(
      queries.join("\n"),
      z.object({
        _field: z.string(),
        _value: z.union([z.number(), z.string(), z.boolean(), z.null()]),
        _time: z.string().pipe(z.coerce.date()).optional(),
        result: z.enum(["min", "first", "last", "max", "median"]),
      }),
      (row) => {
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        extractedFields[row.result] = {
          // @ts-expect-error
          ...extractedFields[row.result],
          [row._field]: row._value,
        };
      },
    );

    const duration = coerceToNumber(extractedFields.last?.chargeDuration);
    if (!duration) return null;

    const result = {
      sessionRangeHash: generateSessionRangeHash(input),
      instanceId: input.instanceId,
      startTime: input.startTime,
      endTime: input.endTime,
      componentId: input.componentId,
      duration,
      startSoc: coerceToNumber(extractedFields.first?.vehicleSoc),
      endSoc: coerceToNumber(extractedFields.max?.vehicleSoc),
      startRange: coerceToNumber(extractedFields.first?.vehicleRange),
      endRange: coerceToNumber(extractedFields.max?.vehicleRange),
      limitSoc: coerceToNumber(extractedFields.first?.vehicleLimitSoc),
      chargedEnergy: coerceToNumber(extractedFields.max?.chargedEnergy),
      sessionEnergy: coerceToNumber(extractedFields.max?.sessionEnergy),
      maxChargePower: coerceToNumber(extractedFields.max?.chargePower),
      maxPhasesActive: coerceToNumber(extractedFields.max?.phasesActive),
      mode: coerceToString(extractedFields.last?.mode),
      price: coerceToNumber(extractedFields.max?.sessionPrice),
      solarPercentage: coerceToNumber(
        extractedFields.last?.sessionSolarPercentage,
      ),
      sessionCo2PerKWh: coerceToNumber(extractedFields.last?.sessionCo2PerKWh),
    };

    return result;
  })
  .callable({ context: { internal: true, session: {} } });
