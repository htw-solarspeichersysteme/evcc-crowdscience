import { os } from "@orpc/server";
import { and, eq, inArray } from "drizzle-orm";
import * as z from "zod";

import { sqliteDb } from "~/db/client";
import {
  csvImportLoadingSessions,
  extractedLoadingSessions,
} from "~/db/schema";
import { env } from "~/env";
import {
  instanceIdsFilterSchema,
  timeRangeInputSchema,
} from "~/lib/globalSchemas";
import { parseLoadingSessionCsv } from "~/lib/import-export/parseLoadingSessionCsv";
import { buildFluxQuery, queryInflux } from "~/lib/influx-query";
import { authedProcedure } from "../middleware";
import { extractSessionRanges, interestingSessionFields } from "./extractor";
import {
  extractedSessionRangeSchema,
  extractedSessionSchema,
  type ExtractedFields,
  type ExtractedSessionRange,
} from "./types";

function generateSessionId(sessionRange: ExtractedSessionRange) {
  return String(Bun.hash(JSON.stringify(sessionRange)));
}

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

export const loadingSessionsRouter = {
  getExtractedSessions: os
    .input(instanceIdsFilterSchema)
    .handler(async ({ input }) => {
      return sqliteDb
        .select()
        .from(extractedLoadingSessions)
        .where(
          and(
            input.instanceIds?.length
              ? inArray(extractedLoadingSessions.instanceId, input.instanceIds)
              : undefined,
          ),
        );
    }),
  getImportedSessions: os
    .input(instanceIdsFilterSchema)
    .handler(async ({ input }) => {
      return sqliteDb
        .select()
        .from(csvImportLoadingSessions)
        .where(
          input.instanceIds?.length
            ? inArray(csvImportLoadingSessions.instanceId, input.instanceIds)
            : undefined,
        );
    }),
  importSessions: authedProcedure
    .input(
      z.object({
        csvFile: z.instanceof(File),
        instanceId: z.string(),
      }),
    )
    .handler(async ({ input }) => {
      const instanceId = input.instanceId;

      // Parse CSV file
      const csvText = await input.csvFile.text();
      const rows = await parseLoadingSessionCsv(csvText);

      // Check existing records for this instance
      const existingData =
        await sqliteDb.query.csvImportLoadingSessions.findMany({
          where: eq(csvImportLoadingSessions.instanceId, instanceId),
        });

      const existingHashes = new Set(existingData.map((row) => row.lineHash));

      // Prepare rows with metadata and deduplication
      const rowsWithMetadata = rows
        .map((row) => ({
          ...row,
          startTime: new Date(row.startTime),
          endTime: new Date(row.endTime),
          instanceId,
          lineHash: String(Bun.hash(JSON.stringify({ row, instanceId }))),
        }))
        .filter((row) => !existingHashes.has(row.lineHash));

      // Insert new records
      if (rowsWithMetadata.length > 0) {
        await sqliteDb
          .insert(csvImportLoadingSessions)
          .values(rowsWithMetadata);
      }

      // Return all imported sessions for this instance (sorted by startTime)
      const allImported = await sqliteDb
        .select()
        .from(csvImportLoadingSessions)
        .where(eq(csvImportLoadingSessions.instanceId, instanceId))
        .orderBy(csvImportLoadingSessions.startTime);

      return allImported;
    }),
  extractSessions: authedProcedure
    .input(
      z.object({
        instanceId: z.string(),
        timeRange: timeRangeInputSchema,
      }),
    )
    .handler(async ({ input }) => {
      const ranges = await extractSessionRanges({
        instanceId: input.instanceId,
        timeRange: input.timeRange,
      });

      return ranges;
    }),
  extractSessionData: authedProcedure
    .input(extractedSessionRangeSchema)
    .output(extractedSessionSchema)
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

      const result = {
        id: generateSessionId(input),
        instanceId: input.instanceId,
        startTime: input.startTime,
        endTime: input.endTime,
        componentId: input.componentId,
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
        sessionCo2PerKWh: coerceToNumber(
          extractedFields.last?.sessionCo2PerKWh,
        ),
      };

      return result;
    }),
};
