import { z } from "zod";

import { getTimeRangeDefaults } from "~/constants";

export const instancesFilterSchema = z.object({
  id: z.string().optional(),
  updatedWithinHours: z.number().optional(),
  chargingBehaviour: z
    .enum(["daily", "multiplePerWeek", "weekly", "rarely"])
    .array()
    .optional(),
  pvPower: z.array(z.number()).optional(),
  loadpointPower: z.array(z.number()).optional(),
});

export const instanceIdsFilterSchema = z.object({
  instanceIds: z.array(z.string()).optional(),
});

export const timeRangeSchema = z.object({
  start: z.number(),
  end: z.number(),
  windowMinutes: z.number(),
});
export type TimeRange = z.infer<typeof timeRangeSchema>;

export const timeRangeInputSchema = timeRangeSchema
  .partial()
  .default({})
  .transform((data) => {
    const defaults = getTimeRangeDefaults();
    return {
      start: new Date(data.start ?? defaults.start),
      end: new Date(data.end ?? defaults.end),
      windowMinutes: data.windowMinutes ?? defaults.windowMinutes,
    };
  });
export type TimeRangeInput = z.infer<typeof timeRangeInputSchema>;

export const timeRangeUrlSchema = timeRangeSchema.partial().optional();
export type UrlTimeRange = z.infer<typeof timeRangeUrlSchema>;

export type TimeSeriesData<TValue extends number | string | boolean | null> = {
  value: TValue;
  timeStamp: number;
};

export type WindowedTimeSeriesData<
  TValue extends number | string | boolean | null,
> = TimeSeriesData<TValue> & {
  startTimeStamp: number;
  endTimeStamp: number;
};

export const singleInstanceRouteSearchSchema = z.object({
  expandedKey: z.string().optional(),
  timeRange: timeRangeUrlSchema,
  chartTopic: z.string().default("pv"),
  chartTopicField: z.string().optional(),
});
