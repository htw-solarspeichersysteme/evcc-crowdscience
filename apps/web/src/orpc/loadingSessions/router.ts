import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { z } from "zod";

import { sqliteDb } from "~/db/client";
import {
  csvImportLoadingSessions,
  extractedLoadingSessions,
} from "~/db/schema";
import { instanceIdsFilterSchema } from "~/lib/globalSchemas";
import { authedProcedure, publicProcedure } from "../middleware";
import { extractSessionDetails } from "./extractDetails";
import { extractSessionRanges } from "./extractRanges";
import { importSessions } from "./import";
import { csvImportLoadingSessionSchema, extractedSessionSchema } from "./types";

export const loadingSessionsRouter = {
  getExtractedSessions: publicProcedure
    .route({
      tags: ["Loading Sessions"],
      summary: "Get extracted sessions",
      description:
        "Retrieves automatically extracted loading sessions from InfluxDB time series data",
    })
    .input(instanceIdsFilterSchema)
    .output(
      z.array(extractedSessionSchema).meta({
        examples: [
          [
            {
              id: "sess_1",
              sessionRangeHash: "abc123hash",
              instanceId: "018f3d4a-5b6c-7d8e-af01-23456789abcd",
              startTime: 1704110400000,
              endTime: 1704117600000,
              duration: 7200,
              componentId: "lp-1",
            },
          ],
        ],
      }),
    )
    .handler(({ input }) => {
      return sqliteDb.query.extractedLoadingSessions.findMany({
        where: input.instanceIds?.length
          ? inArray(extractedLoadingSessions.instanceId, input.instanceIds)
          : undefined,
        orderBy: [desc(extractedLoadingSessions.startTime)],
      });
    }),
  getSocDistribution: publicProcedure
    .route({
      tags: ["Loading Sessions"],
      summary: "Get SOC distribution",
      description:
        "Retrieves the session count and the start/end SOC pairs of extracted loading sessions, a lightweight alternative to fetching all sessions",
    })
    .input(instanceIdsFilterSchema)
    .output(
      z
        .object({
          sessionCount: z.number().describe("Number of extracted sessions"),
          socPairs: z
            .array(z.tuple([z.number(), z.number()]))
            .describe("[startSoc, endSoc] of sessions where both are known"),
        })
        .meta({ examples: [{ sessionCount: 2, socPairs: [[20, 80]] }] }),
    )
    .handler(async ({ input }) => {
      const instanceFilter = input.instanceIds?.length
        ? inArray(extractedLoadingSessions.instanceId, input.instanceIds)
        : undefined;

      const [sessionCount, rows] = await Promise.all([
        sqliteDb.$count(extractedLoadingSessions, instanceFilter),
        sqliteDb
          .select({
            startSoc: extractedLoadingSessions.startSoc,
            endSoc: extractedLoadingSessions.endSoc,
          })
          .from(extractedLoadingSessions)
          .where(
            and(
              instanceFilter,
              isNotNull(extractedLoadingSessions.startSoc),
              isNotNull(extractedLoadingSessions.endSoc),
            ),
          ),
      ]);

      return {
        sessionCount,
        socPairs: rows.map((row): [number, number] => [
          row.startSoc!,
          row.endSoc!,
        ]),
      };
    }),
  getSessionByHash: publicProcedure
    .route({
      tags: ["Loading Sessions"],
      summary: "Get session by hash",
      description:
        "Retrieves a specific loading session from the db by its unique session range hash",
    })
    .input(
      z
        .object({
          sessionRangeHash: z
            .string()
            .describe("Unique hash identifying a session time range"),
        })
        .meta({ examples: [{ sessionRangeHash: "abc123hash" }] }),
    )
    .output(extractedSessionSchema)
    .handler(async ({ input, errors }) => {
      const session = await sqliteDb.query.extractedLoadingSessions.findFirst({
        where: eq(
          extractedLoadingSessions.sessionRangeHash,
          input.sessionRangeHash,
        ),
      });
      if (!session) {
        throw errors.NOT_FOUND({ message: "Session not found" });
      }
      return session;
    }),
  getImportedSessions: publicProcedure
    .route({
      tags: ["Loading Sessions"],
      summary: "Get imported sessions",
      description:
        "Retrieves loading sessions that were manually imported from CSV files",
    })
    .input(instanceIdsFilterSchema)
    .output(
      z.array(csvImportLoadingSessionSchema).meta({
        examples: [
          [
            {
              id: "imp_1",
              instanceId: "018f3d4a-5b6c-7d8e-af01-23456789abcd",
              startTime: 1704110400000,
              endTime: 1704117600000,
              energy: 15.0,
            },
          ],
        ],
      }),
    )
    .handler(({ input }) => {
      return sqliteDb.query.csvImportLoadingSessions.findMany({
        where: input.instanceIds?.length
          ? inArray(csvImportLoadingSessions.instanceId, input.instanceIds)
          : undefined,
      });
    }),
  deleteImportedSessions: authedProcedure
    .route({
      tags: ["Loading Sessions"],
      summary: "Delete imported sessions",
      description:
        "Deletes CSV-imported loading sessions for specified instances",
    })
    .input(instanceIdsFilterSchema)
    .output(
      z
        .void()
        .describe("No return value - deletion completed successfully")
        .meta({ examples: [undefined] }),
    )
    .handler(async ({ input }) => {
      return sqliteDb
        .delete(csvImportLoadingSessions)
        .where(
          input.instanceIds?.length
            ? inArray(csvImportLoadingSessions.instanceId, input.instanceIds)
            : undefined,
        );
    }),
  deleteExtractedSessions: authedProcedure
    .route({
      tags: ["Loading Sessions"],
      summary: "Delete extracted sessions",
      description:
        "Deletes automatically extracted loading sessions for specified instances",
    })
    .input(instanceIdsFilterSchema)
    .output(
      z
        .void()
        .describe("No return value - deletion completed successfully")
        .meta({ examples: [undefined] }),
    )
    .handler(async ({ input }) => {
      return sqliteDb
        .delete(extractedLoadingSessions)
        .where(
          input.instanceIds?.length
            ? inArray(extractedLoadingSessions.instanceId, input.instanceIds)
            : undefined,
        );
    }),
  importSessions,
  extractSessionRanges,
  extractSessionDetails,
};
