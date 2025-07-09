import { json } from "@tanstack/react-start";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { eq, isNull, lt, type InferSelectModel } from "drizzle-orm";

import { sqliteDb } from "~/db/client";
import { extractedLoadingSessions, instances } from "~/db/schema";
import { validateBasicAuth } from "~/lib/apiHelper";
import { getActiveInstancesHandler } from "~/serverHandlers/instance/getActiveInstances";
import {
  extractAndSaveSessions,
  type ExtractedSessions,
} from "~/serverHandlers/loadingSession/extractSessions";

export const ServerRoute = createServerFileRoute("/api/run-jobs").methods({
  GET: async ({ request }) => {
    if (!(await validateBasicAuth(request))) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeInstances = await getActiveInstancesHandler({});

    const res: Record<
      string,
      {
        extracted: ExtractedSessions;
        saved: InferSelectModel<typeof extractedLoadingSessions>[];
      }
    > = {};

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
      const { extracted, saved } = await extractAndSaveSessions(instance.id);

      await sqliteDb
        .update(instances)
        .set({ lastJobRun: new Date(Date.now()) })
        .where(eq(instances.id, instance.id));

      res[instance.id] = { extracted, saved };
    }

    return json(res);
  },
});
