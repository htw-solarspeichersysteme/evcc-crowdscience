import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { min, subMinutes } from "date-fns";
import { router } from "react-query-kit";
import { sum } from "simple-statistics";
import { z } from "zod";

import { possibleInstanceTimeSeriesMetrics } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { protectedFnMiddleware } from "~/globalMiddleware";
import {
  instanceIdsFilterSchema,
  timeRangeInputSchema,
} from "~/lib/globalSchemas";
import { timeSeriesQueryMiddleware } from "~/lib/timeSeriesQueryMiddleware";
import { getActiveInstancesHandler } from "./getActiveInstances";

export const getActiveInstances = createServerFn()
  .validator(zodValidator(z.object({ instanceId: z.string() }).optional()))
  .middleware([protectedFnMiddleware])
  .handler(getActiveInstancesHandler);

export type ActiveInstances = Awaited<ReturnType<typeof getActiveInstances>>;

export const getTimeSeriesData = createServerFn()
  .validator(
    zodValidator(
      z
        .object({
          metric: z.enum(possibleInstanceTimeSeriesMetrics),
          instanceId: z.string(),
        })
        .merge(timeRangeInputSchema),
    ),
  )
  .handler(async ({ data }) => {
    const res = [];

    const rowSchema = z
      .object({
        _value: z
          .union([z.number(), z.string().min(1)])
          .nullable()
          .catch(null),
        _time: z.coerce.date(),
        _start: z.coerce.date(),
        _stop: z.coerce.date(),
      })
      .transform((r) => [r._time.getTime(), r._value] as const);

    if (data.timeRange.end.getTime() < data.timeRange.start.getTime()) {
      return [];
    }

    for await (const { values, tableMeta } of influxDb.iterateRows(
      `from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: ${data.timeRange.start.toISOString()}, stop: ${min([
          data.timeRange.end,
          new Date(),
        ]).toISOString()})
        |> filter(fn: (r) => r["instance"] == "${data.instanceId}")
        |> filter(fn: (r) => r["_field"] == "${data.metric}")
        |> aggregateWindow(every: ${data.timeRange.windowMinutes}m, fn: last, createEmpty: true)
        |> fill(column: "_value", usePrevious: true)
        |> yield(name: "last")
     `,
    )) {
      const row = tableMeta.toObject(values);
      const parsedRow = rowSchema.parse(row);
      res.push(parsedRow);
    }

    // we don't query future data, so fill the rest up with nulls
    if (data.timeRange.end.getTime() > Date.now()) {
      const totalBlocks = Math.ceil(
        (data.timeRange.end.getTime() - data.timeRange.start.getTime()) /
          (data.timeRange.windowMinutes * 60 * 1000),
      );
      for (let i = res.length; i <= totalBlocks; i++) {
        res.push([
          data.timeRange.start.getTime() +
            data.timeRange.windowMinutes * 60 * 1000 * i,
          null,
        ] as const);
      }
    }

    return res;
  });

export const getSendingActivity = createServerFn()
  .validator(
    zodValidator(
      z.object({ instanceId: z.string() }).merge(timeRangeInputSchema),
    ),
  )
  .handler(async ({ data }) => {
    const res = [];
    const rowSchema = z
      .object({
        _value: z.string().or(z.number()).nullable(),
        _time: z.coerce.date(),
      })
      .transform((r) => {
        return {
          value: r._value ? +r._value * 1000 : null,
          timeStamp: r._time.getTime(),
          endTimeStamp: r._time.getTime(),
          startTimeStamp: subMinutes(
            r._time,
            data.timeRange.windowMinutes,
          ).getTime(),
        };
      });

    for await (const {
      values,
      tableMeta,
    } of influxDb.iterateRows(`from(bucket: "${env.INFLUXDB_BUCKET}")
      |> range(start: ${data.timeRange.start.toISOString()}, stop: ${data.timeRange.end.toISOString()})
      |> filter(fn: (r) => r["_measurement"] == "updated")
      |> filter(fn: (r) => r["instance"] == "${data.instanceId}")
      |> aggregateWindow(every: ${data.timeRange.windowMinutes}m, fn: last, createEmpty: true)
      |> yield(name: "last")
    `)) {
      const row = tableMeta.toObject(values);
      const parsedRow = rowSchema.parse(row);
      res.push(parsedRow);
    }

    return res;
  });

export const getChargingHourHistogram = createServerFn()
  .validator(zodValidator(instanceIdsFilterSchema.merge(timeRangeInputSchema)))
  .handler(async ({ data }) => {
    const res: Record<string, number[]> = {};
    const rowSchema = z.object({
      _value: z.number(),
      le: z.number(),
      instance: z.string(),
    });

    for await (const { values, tableMeta } of influxDb.iterateRows(`
      import "date"
      import "array"
      instanceIds = ${JSON.stringify(data.instanceIds)}

      from(bucket: "${env.INFLUXDB_BUCKET}")
        // |> range(start: ${data.timeRange.start.toISOString()}, stop: ${data.timeRange.end.toISOString()})
        |> range(start: -30d)
        |> filter(fn: (r) => r["_measurement"] == "loadpoints" and r["_field"] == "chargeCurrent")
        |> window(every: 1h, createEmpty: false)
        |> max()
        ${data.instanceIds?.length ? `|> filter(fn: (r) => contains(value: r["instance"], set: instanceIds))` : ""}
        |> group(columns: ["instance"])
        |> filter(fn: (r) => r["_value"] > 0)
        |> map(fn: (r) => ({
            r with
            floatHour: float(v: date.hour(t: r._time))
          }))
        |> histogram(bins: linearBins(count: 24, width: 1.0, start: 0.0), column: "floatHour")
        |> group(columns: ["le"])
    `)) {
      const row = tableMeta.toObject(values);
      const parsedRow = rowSchema.parse(row);

      if (!res[parsedRow.instance]) {
        res[parsedRow.instance] = [];
      }
      if (parsedRow.le <= 23) {
        res[parsedRow.instance].push(parsedRow._value);
      }
    }

    // go over every instance and calculate the difference between the values
    // from behind, leave first as it is
    for (const instance in res) {
      for (let i = res[instance].length - 1; i > 0; i--) {
        res[instance][i] = res[instance][i] - res[instance][i - 1];
      }
    }
    return Object.fromEntries(
      Object.entries(res).sort((a, b) => sum(b[1]) - sum(a[1])),
    );
  });

export const instanceApi = router("instance", {
  getActiveInstances: router.query({
    fetcher: getActiveInstances,
  }),
  getTimeSeriesData: router.query({
    fetcher: getTimeSeriesData,
    use: [timeSeriesQueryMiddleware],
  }),
  getSendingActivity: router.query({
    fetcher: getSendingActivity,
    use: [timeSeriesQueryMiddleware],
  }),
  getChargingHourHistogram: router.query({
    fetcher: getChargingHourHistogram,
    // use: [timeSeriesQueryMiddleware],
  }),
});
