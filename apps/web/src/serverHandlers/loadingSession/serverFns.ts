import { createServerFn } from "@tanstack/react-start";
import { and, inArray } from "drizzle-orm";
import { router } from "react-query-kit";
import * as z from "zod";

import { sqliteDb } from "~/db/client";
import {
  csvImportLoadingSessions,
  extractedLoadingSessions,
} from "~/db/schema";
import { adminFnMiddleware, protectedFnMiddleware } from "~/globalMiddleware";
import { instanceIdsFilterSchema } from "~/lib/globalSchemas";
import {
  extractAndSaveSessions,
  extractSessionsHandler,
  extractSessionsSchema,
} from "./extractSessions";

export const extractSessions = createServerFn()
  .inputValidator(extractSessionsSchema)
  .middleware([adminFnMiddleware])
  .handler(extractSessionsHandler);

export const getExtractedSessions = createServerFn()
  .inputValidator(instanceIdsFilterSchema)
  .middleware([protectedFnMiddleware])
  .handler(async ({ data }) => {
    return sqliteDb
      .select()
      .from(extractedLoadingSessions)
      .where(
        and(
          data.instanceIds?.length
            ? inArray(extractedLoadingSessions.instanceId, data.instanceIds)
            : undefined,
        ),
      );
  });

export const getImportedSessions = createServerFn()
  .inputValidator(instanceIdsFilterSchema)
  .middleware([protectedFnMiddleware])
  .handler(async ({ data }) => {
    return sqliteDb
      .select()
      .from(csvImportLoadingSessions)
      .where(
        data.instanceIds?.length
          ? inArray(csvImportLoadingSessions.instanceId, data.instanceIds)
          : undefined,
      );
  });

export const deleteExtractedSessions = createServerFn()
  .inputValidator(instanceIdsFilterSchema)
  .middleware([adminFnMiddleware])
  .handler(async ({ data }) => {
    if (!data.instanceIds) return;
    return sqliteDb
      .delete(extractedLoadingSessions)
      .where(inArray(extractedLoadingSessions.instanceId, data.instanceIds));
  });

export const deleteImportedSessions = createServerFn()
  .inputValidator(instanceIdsFilterSchema)
  .middleware([adminFnMiddleware])
  .handler(async ({ data }) => {
    if (!data.instanceIds) return;
    return sqliteDb
      .delete(csvImportLoadingSessions)
      .where(inArray(csvImportLoadingSessions.instanceId, data.instanceIds));
  });

export const triggerExtraction = createServerFn()
  .inputValidator(z.object({ instanceId: z.string() }))
  .middleware([adminFnMiddleware])
  .handler(async ({ data }) => {
    const { extracted, saved } = await extractAndSaveSessions(data.instanceId);
    return { extracted, saved };
  });

export const getLoadingSessionsCount = createServerFn()
  .inputValidator(instanceIdsFilterSchema)
  .middleware([protectedFnMiddleware])
  .handler(() => {
    return 0;
  });

export const loadingSessionApi = router("loadingSession", {
  extractSessions: router.mutation({ mutationFn: extractSessions }),
  getExtractedSessions: router.query({ fetcher: getExtractedSessions }),
  getImportedSessions: router.query({ fetcher: getImportedSessions }),
  getLoadingSessionsCount: router.query({ fetcher: getLoadingSessionsCount }),
  triggerExtraction: router.mutation({ mutationFn: triggerExtraction }),
  deleteExtractedSessions: router.mutation({
    mutationFn: deleteExtractedSessions,
  }),
  deleteImportedSessions: router.mutation({
    mutationFn: deleteImportedSessions,
  }),
});
