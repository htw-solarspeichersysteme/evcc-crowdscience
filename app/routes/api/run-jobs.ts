import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { eq, lt } from "drizzle-orm";

import { sqliteDb } from "~/db/client";
import { extractedLoadingSessions, instances } from "~/db/schema";
import { validateBasicAuth } from "~/lib/apiHelper";
import { getActiveInstancesHandler } from "~/serverHandlers/instance/getActiveInstances";
import {
  extractSessionsHandler,
  type ExtractedLoadingSessions,
} from "~/serverHandlers/loadingSession/extractSessions";

export const APIRoute = createAPIFileRoute("/api/run-jobs")({
  GET: async ({ request }) => {
    if (!(await validateBasicAuth(request))) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeInstances = await getActiveInstancesHandler({
      data: {},
    });

    const sessions: ExtractedLoadingSessions = [];
    // await sqliteDb.delete(instances);

    await sqliteDb
      .insert(instances)
      .values(
        activeInstances.map((i) => ({
          id: i.id,
          hidden: false,
        })),
      )
      .onConflictDoNothing();

    const instancesToExtractFrom = await sqliteDb
      .select()
      .from(instances)
      .where(
        lt(instances.lastJobRun, new Date(Date.now() - 1 * 60 * 60 * 1000)),
      )
      // make sure it finishes all the extractions every hour
      // this endpoint is called every three minutes
      .limit(Math.ceil(activeInstances.length / (60 / 3)));

    for (const instance of instancesToExtractFrom) {
      const instanceSessions = await extractSessionsHandler({
        data: { instanceId: instance.id },
      });
      sessions.push(...instanceSessions);

      await sqliteDb
        .update(instances)
        .set({ lastJobRun: new Date(Date.now()) })
        .where(eq(instances.id, instance.id));
      if (instanceSessions.length)
        await sqliteDb
          .insert(extractedLoadingSessions)
          .values(
            instanceSessions.map((session) => ({
              startTime: session.start,
              endTime: session.end,
              instanceId: instance.id,
              id: String(
                Bun.hash(
                  JSON.stringify({
                    session,
                    instanceId: instance.id,
                    componentId: session.componentId,
                    // this is to make sure the line hash is the same for the same session
                    startTime: session.start.setSeconds(0, 0),
                    endTime: session.end.setSeconds(0, 0),
                  }),
                ),
              ),
            })),
          )
          .onConflictDoNothing();
    }

    return json({ message: "Hello /api/run-jobs!", activeInstances, sessions });
  },
});
