import { isDefinedError, safe } from "@orpc/client";
import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { eq, isNull, lt, type InferSelectModel } from "drizzle-orm";

import { sqliteDb } from "~/db/client";
import { extractedLoadingSessions, instances } from "~/db/schema";
import { orpc } from "~/orpc/client";
import {
  extractAndSaveSessions,
  type ExtractedSessions,
} from "~/serverHandlers/loadingSession/extractSessions";

export const Route = createFileRoute("/api/run-jobs")({
  server: {
    handlers: {
      GET: async () => {
        const { error, data: instanceOverview } = await safe(
          orpc.instances.getOverview.call(),
        );

        if (isDefinedError(error)) {
          return json({ error: error.message }, { status: error.status });
        } else if (error) {
          return json({ error: error.message }, { status: 500 });
        }

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
            instanceOverview.map((i) => ({
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
          .limit(Math.ceil(instanceOverview.length / (60 / 3)));

        for (const instance of instancesToExtractFrom) {
          const { extracted, saved } = await extractAndSaveSessions(
            instance.id,
          );

          await sqliteDb
            .update(instances)
            .set({ lastJobRun: new Date(Date.now()) })
            .where(eq(instances.id, instance.id));

          res[instance.id] = { extracted, saved };
        }

        return json(res);
      },
    },
  },
});
