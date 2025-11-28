import z from "zod";

import type { interestingSessionFields } from "./extractor";

export const extractedSessionRangeSchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  componentId: z.string(),
  instanceId: z.string(),
});

export type ExtractedSessionRange = z.infer<typeof extractedSessionRangeSchema>;

type InterestingFields = typeof interestingSessionFields;
type GroupTypes = keyof InterestingFields;
type FieldsByGroup<G extends GroupTypes> = InterestingFields[G][number];

export type ExtractedFields = Partial<{
  [G in GroupTypes]: Record<FieldsByGroup<G>, number | string | boolean | null>;
}>;

export const extractedSessionSchema = z.object({
  id: z.string(),
  instanceId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  componentId: z.string(),
  startSoc: z.number().nullish(),
  endSoc: z.number().nullish(),
  startRange: z.number().nullish(),
  endRange: z.number().nullish(),
  limitSoc: z.number().nullish(),
  chargedEnergy: z.number().nullish(),
  sessionEnergy: z.number().nullish(),
  maxChargePower: z.number().nullish(),
  maxPhasesActive: z.number().nullish(),
  mode: z.string().nullish(),
  price: z.number().nullish(),
  solarPercentage: z.number().nullish(),
  sessionCo2PerKWh: z.number().nullish(),
});

export type ExtractedSession = z.infer<typeof extractedSessionSchema>;
