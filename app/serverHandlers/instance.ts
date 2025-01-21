import { createServerFn } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { subHours, subMinutes } from "date-fns";
import { humanId } from "human-id";
import { router } from "react-query-kit";
import { z } from "zod";

import {
  instanceCountsAsActiveDays,
  possibleInstanceTimeSeriesMetrics,
} from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { protectedFnMiddleware } from "~/globalMiddleware";
import { getInstancesQueryMiddleware } from "~/hooks/use-instances-filter";
import {
  instancesFilterSchema,
  timeRangeInputSchema,
} from "~/lib/globalSchemas";
import { timeSeriesQueryMiddleware } from "~/lib/timeSeriesQueryMiddleware";
import { withinRange } from "~/lib/utils";

export const getActiveInstancesSchema = z.object({
  filter: instancesFilterSchema.optional(),
});

export const getActiveInstances = createServerFn()
  .validator(zodValidator(getActiveInstancesSchema))
  .middleware([protectedFnMiddleware])
  .handler(async ({ data }) => {
    const rowSchema = z
      .object({
        result: z.literal("last-update"),
        _value: z.string(),
        instance: z.string(),
        _measurement: z.literal("updated"),
      })
      .or(
        z
          .object({
            result: z.literal("max-pv-power"),
            _value: z.number(),
            instance: z.string(),
            _measurement: z.literal("site"),
            _field: z.literal("pvPower"),
          })
          .transform((r) => ({
            ...r,
            _value: r._value / 1000,
          })),
      )
      .or(
        z.object({
          result: z.literal("max-loadpoint-power"),
          _value: z.number(),
          instance: z.string(),
        }),
      );

    const start = subHours(
      new Date(),
      data?.filter?.updatedWithinHours
        ? data.filter.updatedWithinHours
        : instanceCountsAsActiveDays * 24,
    );
    const end = new Date();

    const instances = new Map<
      string,
      {
        id: string;
        lastUpdate?: Date;
        pvPower?: number;
        loadpointPower?: number;
      }
    >();
    for await (const { values, tableMeta } of influxDb.iterateRows(
      `
      import "strings"

      from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: ${start.toISOString()}, stop: ${end.toISOString()})
        |> filter(fn: (r) => r["_measurement"] == "updated")
        |> last()
        ${data?.filter?.id ? `|> filter(fn: (r) => strings.containsStr(v: r["instance"], substr: "${data.filter.id}"))` : ""}
        |> yield(name: "last-update")

      from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: ${start.toISOString()}, stop: ${end.toISOString()})
        |> filter(fn: (r) => r["_measurement"] == "site")
        |> filter(fn: (r) => r["_field"] == "pvPower")
        |> max()
        |> yield(name: "max-pv-power")

      from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: -365d)
        |> filter(fn: (r) => r["_measurement"] == "loadpoints")
        |> filter(fn: (r) => r["_field"] == "maxCurrent")
        |> last()
        |> group(columns: ["instance"])
        |> sum()
        |> yield(name: "max-loadpoint-power")
     `,
    )) {
      const row = tableMeta.toObject(values);
      const parsedRow = rowSchema.safeParse(row);
      if (!parsedRow.success) continue;

      // add instance if it doesn't exist
      if (!instances.has(parsedRow.data.instance)) {
        instances.set(parsedRow.data.instance, {
          id: parsedRow.data.instance,
        });
      }

      if (parsedRow.data.result === "last-update") {
        instances.get(parsedRow.data.instance)!.lastUpdate = new Date(
          parseInt(parsedRow.data._value) * 1000,
        );
      } else if (parsedRow.data.result === "max-pv-power") {
        instances.get(parsedRow.data.instance)!.pvPower = parsedRow.data._value;
      } else if (parsedRow.data.result === "max-loadpoint-power") {
        instances.get(parsedRow.data.instance)!.loadpointPower =
          parsedRow.data._value;
      }
    }

    return (
      Array.from(instances.values())
        .filter((instance) => {
          if (!instance.lastUpdate) return false;
          // check that it conforms to the filter
          if (
            data.filter?.pvPower &&
            !withinRange(
              data.filter.pvPower[0],
              data.filter.pvPower[1],
              instance.pvPower,
            )
          ) {
            return false;
          }
          if (
            data.filter?.loadpointPower &&
            !withinRange(
              data.filter.loadpointPower[0],
              data.filter.loadpointPower[1],
              instance.loadpointPower,
            )
          ) {
            return false;
          }
          return true;
        })
        // sort by most recent update
        .sort((a, b) => b.lastUpdate!.getTime() - a.lastUpdate!.getTime())
    );
  });

export const generateInstanceId = createServerFn().handler(async () => {
  const instanceId = humanId({
    separator: "-",
    capitalize: false,
  });

  return instanceId;
});

export const getLatestInstanceUpdate = createServerFn()
  .validator(
    zodValidator(
      z.object({
        instanceId: z.string(),
        hasToBeRecent: z.boolean().default(false),
      }),
    ),
  )
  .handler(async ({ data }) => {
    const rows = await influxDb.collectRows(
      `from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: ${data.hasToBeRecent ? "-3m" : "-1y"})
        |> filter(fn: (r) => r["_measurement"] == "updated")
        |> filter(fn: (r) => r["instance"] == "${data.instanceId}")
        |> last()
     `,
    );

    // make sure it has the correct shape
    const res = z.object({ _value: z.string() }).safeParse(rows?.[0]);
    if (!res.success) return null;

    return new Date(parseInt(res.data._value) * 1000);
  });

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
      .transform((r) => ({
        value: r._value,
        timeStamp: r._time.getTime(),
        startTimeStamp: r._start.getTime(),
        endTimeStamp: r._stop.getTime(),
      }));
    for await (const { values, tableMeta } of influxDb.iterateRows(
      `from(bucket: "${env.INFLUXDB_BUCKET}")
        |> range(start: ${data.timeRange.start.toISOString()}, stop: ${data.timeRange.end.toISOString()})
        |> filter(fn: (r) => r["instance"] == "${data.instanceId}")
        |> filter(fn: (r) => r["_field"] == "${data.metric}")
        |> aggregateWindow(every: ${data.timeRange.windowMinutes}m, fn: last, createEmpty: true)
        |> yield(name: "last")
     `,
    )) {
      const row = tableMeta.toObject(values);
      const parsedRow = rowSchema.parse(row);
      res.push(parsedRow);
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
        _value: z.string(),
        _time: z.coerce.date(),
      })
      .transform((r) => {
        const parsedValue = new Date(parseInt(r._value));
        return {
          value: !isNaN(parsedValue.getTime()),
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

export const instanceApi = router("instance", {
  getActiveInstances: router.query({
    fetcher: getActiveInstances,
    use: [getInstancesQueryMiddleware],
  }),
  getLatestInstanceUpdate: router.query({
    fetcher: getLatestInstanceUpdate,
  }),
  generateInstanceId: router.mutation({ mutationFn: generateInstanceId }),
  getTimeSeriesData: router.query({
    fetcher: getTimeSeriesData,
    use: [timeSeriesQueryMiddleware],
  }),
  getSendingActivity: router.query({
    fetcher: getSendingActivity,
    use: [timeSeriesQueryMiddleware],
  }),
});
