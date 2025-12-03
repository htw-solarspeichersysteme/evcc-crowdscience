import { os } from "@orpc/server";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { sqliteDb } from "~/db/client";
import {
  csvImportLoadingSessions,
  extractedLoadingSessions,
} from "~/db/schema";
import { instanceIdsFilterSchema } from "~/lib/globalSchemas";
import { authedProcedure } from "../middleware";
import { extractSessionDetails } from "./extractDetails";
import { extractSessionRanges } from "./extractRanges";
import { importSessions } from "./import";

export const loadingSessionsRouter = {
  getExtractedSessions: os
    .input(instanceIdsFilterSchema)
    .handler(({ input }) => {
      return sqliteDb.query.extractedLoadingSessions.findMany({
        where: input.instanceIds?.length
          ? inArray(extractedLoadingSessions.instanceId, input.instanceIds)
          : undefined,
        orderBy: [desc(extractedLoadingSessions.startTime)],
      });
    }),
  getSessionByHash: os
    .input(z.object({ sessionRangeHash: z.string() }))
    .handler(({ input }) => {
      return sqliteDb.query.extractedLoadingSessions.findFirst({
        where: eq(
          extractedLoadingSessions.sessionRangeHash,
          input.sessionRangeHash,
        ),
      });
    }),
  getImportedSessions: os
    .input(instanceIdsFilterSchema)
    .handler(({ input }) => {
      return sqliteDb.query.csvImportLoadingSessions.findMany({
        where: input.instanceIds?.length
          ? inArray(csvImportLoadingSessions.instanceId, input.instanceIds)
          : undefined,
      });
    }),
  deleteImportedSessions: authedProcedure
    .input(instanceIdsFilterSchema)
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
    .input(instanceIdsFilterSchema)
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
