import { and, eq, isNotNull, like } from "drizzle-orm";
import * as z from "zod";

import { sqliteDb } from "~/db/client";
import { instances } from "~/db/schema";
import { pick } from "~/lib/typeHelpers";
import { instancesOverviewInputSchema } from "~/schema/instances";
import { authedProcedure } from "../middleware";

export type InstanceOverview = {
  id: string;
  publicName: string | null;
  lastReceivedDataAt: number | null;
  firstReceivedDataAt: number | null;
  pvMaxPowerKw?: number;
  loadpointMaxPowerKw?: number;
  siteVersion?: string;
};
export type InstancesOverview = InstanceOverview[];

export const getInstancesOverview = authedProcedure
  .route({
    tags: ["Instances"],
    summary: "Get instances overview",
    description:
      "Retrieves an overview of all instances, with filtering options",
  })
  .input(instancesOverviewInputSchema)
  .output(
    z
      .array(
        z.object({
          id: z.string().describe("Unique instance identifier (UUIDv7)"),
          publicName: z
            .string()
            .nullable()
            .describe("Human-readable public name"),
          lastReceivedDataAt: z.coerce
            .number()
            .nullable()
            .describe("Timestamp of last received data in milliseconds"),
          firstReceivedDataAt: z.coerce
            .number()
            .nullable()
            .describe("Timestamp of first received data in milliseconds"),
          lastExtractedDataAt: z.coerce
            .number()
            .nullable()
            .describe("Timestamp of last data extraction in milliseconds"),
          pvMaxPowerKw: z
            .number()
            .optional()
            .describe("Maximum PV power in kW found in history"),
          loadpointMaxPowerKw: z
            .number()
            .optional()
            .describe("Maximum loadpoint power in kW found in history"),
          siteVersion: z
            .string()
            .optional()
            .describe("Site version found in history"),
        }),
      )
      .meta({
        examples: [
          [
            {
              id: "018f3d4a-5b6c-7d8e-af01-23456789abcd",
              publicName: "shiny-mountain-123",
              lastReceivedDataAt: 1704110400000,
              firstReceivedDataAt: 1704024000000,
              pvMaxPowerKw: 5.5,
              loadpointMaxPowerKw: 11.0,
              siteVersion: "0.301.2",
            },
          ],
        ],
      }),
  )
  .handler(async ({ input }) => {
    const persistedInstances = await sqliteDb.query.instances.findMany({
      where: and(
        input?.showIgnored ? undefined : eq(instances.ignored, false),
        isNotNull(instances.lastReceivedDataAt),
        isNotNull(instances.publicName),
        input?.idFilter ? like(instances.id, `%${input.idFilter}%`) : undefined,
      ),
    });

    return persistedInstances
      .map((instance) => ({
        ...pick(instance, [
          "id",
          "publicName",
          "lastReceivedDataAt",
          "firstReceivedDataAt",
          "lastExtractedDataAt",
        ]),
        pvMaxPowerKw: instance.pvMaxPowerKw ?? undefined,
        loadpointMaxPowerKw: instance.loadpointMaxPowerKw ?? undefined,
        siteVersion: instance.siteVersion ?? undefined,
      }))
      .sort(
        (a, b) =>
          (b.firstReceivedDataAt?.getTime() ?? 0) -
          (a.firstReceivedDataAt?.getTime() ?? 0),
      );
  });
