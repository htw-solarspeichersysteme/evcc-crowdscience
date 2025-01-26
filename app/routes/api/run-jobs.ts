import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { eq, isNull, lt } from "drizzle-orm";

import { sqliteDb } from "~/db/client";
import { extractedLoadingSessions, instances } from "~/db/schema";
import { validateBasicAuth } from "~/lib/apiHelper";
import { getActiveInstancesHandler } from "~/serverHandlers/instance/getActiveInstances";
import { extractSessionsHandler } from "~/serverHandlers/loadingSession/extractSessions";

export const APIRoute = createAPIFileRoute("/api/run-jobs")({
  GET: async ({ request }) => {
    if (!(await validateBasicAuth(request))) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeInstances = await getActiveInstancesHandler({
      data: {},
    });

    const sessions = [];

    // there is old data that we don't want
    // delete it and start again
    if (
      await sqliteDb.query.extractedLoadingSessions.findFirst({
        where: isNull(extractedLoadingSessions.duration),
      })
    ) {
      await sqliteDb.delete(instances);
      await sqliteDb.delete(extractedLoadingSessions);
    }

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
              ...session,
              instanceId: instance.id,
              id: String(
                Bun.hash(
                  JSON.stringify({
                    session,
                    instanceId: instance.id,
                    componentId: session.componentId,
                    // this is to make sure the line hash is the same for the same session
                    startTime: session.startTime.setSeconds(0, 0),
                    endTime: session.endTime.setSeconds(0, 0),
                  }),
                ),
              ),
            })),
          )
          .onConflictDoNothing();
    }

    return json({
      instancesToExtractFrom: instancesToExtractFrom.map((i) => i.id),
      extractedSessions: sessions,
    });
  },
});
