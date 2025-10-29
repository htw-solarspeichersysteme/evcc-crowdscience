import { os } from "@orpc/server";
import { and, inArray } from "drizzle-orm";

import { sqliteDb } from "~/db/client";
import {
  csvImportLoadingSessions,
  extractedLoadingSessions,
} from "~/db/schema";
import { instanceIdsFilterSchema } from "~/lib/globalSchemas";

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
};
