import { format, subDays } from "date-fns";
import { eq, inArray } from "drizzle-orm";
import * as z from "zod";

import { sqliteDb } from "~/db/client";
import { extractedLoadingSessions, instances } from "~/db/schema";
import { generateSessionRangeHash } from "../loadingSessions/helpers";
import { loadingSessionsRouter } from "../loadingSessions/router";
import type { ExtractedSessionRange } from "../loadingSessions/types";
import { adminProcedure } from "../middleware";

const extractSessionsInputSchema = z.object({
  instanceIds: z.array(z.string()).optional(),
});

function printSessionRangeOverview(range: ExtractedSessionRange) {
  return `${range.instanceId} ${range.componentId} ${format(range.startTime, "yyyy-MM-dd HH:mm:ss")} - ${format(range.endTime, "yyyy-MM-dd HH:mm:ss")}`;
}

export const jobsRouter = {
  extractAndSaveSessions: adminProcedure
    .input(extractSessionsInputSchema)
    .handler(async ({ input }) => {
      const instanceIds = (
        await sqliteDb.query.instances.findMany({
          columns: { id: true },
          where: input.instanceIds && inArray(instances.id, input.instanceIds),
        })
      ).map((i) => i.id);

      console.log(
        `[jobs] Extracting sessions for ${instanceIds.length} instance(s)`,
      );

      for (const instanceId of instanceIds) {
        const savedRanges =
          await sqliteDb.query.extractedLoadingSessions.findMany({
            columns: { sessionRangeHash: true },
            where: eq(extractedLoadingSessions.instanceId, instanceId),
          });
        const savedRangeHashes = new Set(
          savedRanges.map((r) => r.sessionRangeHash),
        );

        const extractedRanges =
          await loadingSessionsRouter.extractSessionRanges({
            instanceId,
            timeRange: {
              start: subDays(new Date(), 30).getTime(),
              end: new Date().getTime(),
            },
          });

        for (const range of extractedRanges) {
          const sessionRangeHash = generateSessionRangeHash(range);
          if (savedRangeHashes.has(sessionRangeHash)) {
            continue;
          }

          const result =
            await loadingSessionsRouter.extractSessionDetails(range);

          if (!result) {
            console.log(
              `[jobs] No session details: ${printSessionRangeOverview(range)}`,
            );
            continue;
          }

          console.log(
            `[jobs] Extracted session details: ${printSessionRangeOverview(range)}`,
          );

          await sqliteDb.insert(extractedLoadingSessions).values({
            ...result,
            sessionRangeHash,
            instanceId,
            startTime: range.startTime,
            endTime: range.endTime,
            componentId: range.componentId,
          });
        }
      }
    }),
};
