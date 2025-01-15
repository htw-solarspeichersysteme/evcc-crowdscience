import { subDays } from "date-fns";
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

export const timeRangeSchema = z
  .object({
    start: z.coerce.date(),
    end: z.coerce.date(),
    everyInMinutes: z.number(),
  })
  .default({
    start: subDays(new Date(), 3),
    end: new Date(),
    everyInMinutes: 60,
  });

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
