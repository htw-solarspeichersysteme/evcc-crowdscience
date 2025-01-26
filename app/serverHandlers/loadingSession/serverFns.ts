import { createServerFn } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { router } from "react-query-kit";

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

export const getLoadingSessionsCount = createServerFn()
  .validator(zodValidator(instanceIdsFilterSchema))
  .middleware([protectedFnMiddleware])
  .handler(async ({}) => {
    return 0;
  });

export const loadingSessionsApi = router("loadingSessions", {
  extractSessions: router.mutation({ mutationFn: extractSessions }),
  getLoadingSessionsCount: router.query({ fetcher: getLoadingSessionsCount }),
});
