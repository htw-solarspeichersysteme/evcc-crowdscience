import { createServerFn } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { inArray } from "drizzle-orm";
import { router } from "react-query-kit";

import { sqliteDb } from "~/db/client";
import { extractedLoadingSessions } from "~/db/schema";
import { adminFnMiddleware, protectedFnMiddleware } from "~/globalMiddleware";
import { instanceIdsFilterSchema } from "~/lib/globalSchemas";
import {
  extractSessionsHandler,
  extractSessionsSchema,
} from "./extractSessions";

export const extractSessions = createServerFn()
  .validator(zodValidator(extractSessionsSchema))
  .middleware([adminFnMiddleware])
  .handler(extractSessionsHandler);

export const getExtractedSessions = createServerFn()
  .validator(zodValidator(instanceIdsFilterSchema))
  .middleware([protectedFnMiddleware])
  .handler(async ({ data }) => {
    const baseQuery = sqliteDb.select().from(extractedLoadingSessions);
    const query = data.instanceIds?.length
      ? baseQuery.where(
          inArray(extractedLoadingSessions.instanceId, data.instanceIds),
        )
      : baseQuery;
    return query.execute();
  });

export const getLoadingSessionsCount = createServerFn()
  .validator(zodValidator(instanceIdsFilterSchema))
  .middleware([protectedFnMiddleware])
  .handler(async ({}) => {
    return 0;
  });

export const loadingSessionApi = router("loadingSession", {
  extractSessions: router.mutation({ mutationFn: extractSessions }),
  getExtractedSessions: router.query({ fetcher: getExtractedSessions }),
  getLoadingSessionsCount: router.query({ fetcher: getLoadingSessionsCount }),
});
