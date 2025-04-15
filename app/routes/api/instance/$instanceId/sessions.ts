import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { eq } from "drizzle-orm/expressions";

import { sqliteDb } from "~/db/client";
import {
  csvImportLoadingSessions,
  extractedLoadingSessions,
} from "~/db/schema";
import { validateBasicAuth } from "~/lib/apiHelper";

export const APIRoute = createAPIFileRoute(
  "/api/instance/$instanceId/sessions",
)({
  GET: async ({ request, params }) => {
    if (!(await validateBasicAuth(request))) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const extractedSessions =
      await sqliteDb.query.extractedLoadingSessions.findMany({
        where: eq(extractedLoadingSessions.instanceId, params.instanceId),
      });

    const csvImportSessions =
      await sqliteDb.query.csvImportLoadingSessions.findMany({
        where: eq(csvImportLoadingSessions.instanceId, params.instanceId),
      });

    return json({ extractedSessions, csvImportSessions });
  },
});
