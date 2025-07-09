import { json } from "@tanstack/react-start";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";

import { sqliteDb } from "~/db/client";
import {
  csvImportLoadingSessions,
  extractedLoadingSessions,
} from "~/db/schema";
import { validateBasicAuth } from "~/lib/apiHelper";

export const ServerRoute = createServerFileRoute(
  "/api/instance/$instanceId/sessions",
).methods({
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
