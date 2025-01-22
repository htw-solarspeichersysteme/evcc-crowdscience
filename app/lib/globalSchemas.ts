import { z } from "zod";

import {
  getTimeRangeDefaults,
  possibleInstanceTimeSeriesMetrics,
} from "~/constants";

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

export const timeRangeInputSchema = z.object({
  timeRange: timeRangeSchema
    .partial()
    .extend({
      start: z.number().default(0),
      end: z.number().default(0),
      windowMinutes: z.number().default(getTimeRangeDefaults().windowMinutes),
    })
    .default({})
    .transform((data) => {
      const { start, end, windowMinutes } = data;
      return {
        start: new Date(start ? start : getTimeRangeDefaults().start),
        end: new Date(end ? end : getTimeRangeDefaults().end),
        windowMinutes,
      };
    }),
});

export const timeRangeUrlSchema = timeRangeSchema.partial().default({});
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
  timeSeriesMetric: z
    .enum(possibleInstanceTimeSeriesMetrics)
    .default("batterySoc"),
  timeRange: timeRangeUrlSchema,
});
