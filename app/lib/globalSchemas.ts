import { z } from "zod";

export const instancesFilterSchema = z.object({
  id: z.string().optional(),
  updatedWithinHours: z.number().optional(),
});

export const instanceIdsFilterSchema = z.object({
  instanceIds: z.array(z.string()).optional(),
});

export const instancesFilterSearchSchema = z.object({
  iFltr: instancesFilterSchema.optional(),
});
