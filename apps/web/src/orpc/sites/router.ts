import { os } from "@orpc/server";
import * as z from "zod";

import { instanceCountsAsActiveDays } from "~/constants";
import { influxDb } from "~/db/client";
import { env } from "~/env";
import { buildFluxQuery } from "~/lib/influx-query";
import {
  influxRowBaseSchema,
  type InfluxFieldValues,
  type MetaData,
} from "../types";

const siteMetadataRowSchema = influxRowBaseSchema;

const siteStatisticsRowSchema = influxRowBaseSchema.extend({
  _field: z.enum(["avgCo2", "avgPrice", "chargedKWh", "solarPercentage"]),
  period: z.enum(["30d", "365d", "thisYear", "total"]),
  _value: z.number(),
});

export const sitesRouter = {
  getMetaDataValues: os
    .input(z.object({ instanceId: z.string() }))
    .handler(async ({ input }): Promise<InfluxFieldValues> => {
      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
          |> range(start: {{rangeStart}})
          |> filter(fn: (r) => r["_measurement"] == "site")
          |> filter(fn: (r) => r["instance"] == {{instanceId}})
          |> last()`,
        {
          bucket: env.INFLUXDB_BUCKET,
          rangeStart: `-${instanceCountsAsActiveDays}d`,
          instanceId: input.instanceId,
        },
      );
      let rows;
      try {
        rows = await influxDb.collectRows(query);
      } catch (error) {
        console.error("InfluxDB query error:", error);
        return {};
      }

      const res = siteMetadataRowSchema.array().safeParse(rows);
      if (!res.success) {
        console.error(res.error);
        return {};
      }

      const metaData: InfluxFieldValues = {};

      for (const item of res.data) {
        metaData[item._field] = {
          value: item._value,
          lastUpdate: item._time,
        };
      }

      return metaData;
    }),
  getStatistics: os
    .input(z.object({ instanceId: z.string() }))
    .handler(async ({ input }): Promise<MetaData> => {
      const metaData: MetaData = { values: {}, count: 0 };

      const query = buildFluxQuery(
        `from(bucket: {{bucket}})
          |> range(start: {{rangeStart}})
          |> filter(fn: (r) => r["_measurement"] == "statistics")
          |> filter(fn: (r) => r["instance"] == {{instanceId}})
          |> last()`,
        {
          bucket: env.INFLUXDB_BUCKET,
          rangeStart: `-${instanceCountsAsActiveDays}d`,
          instanceId: input.instanceId,
        },
      );
      let rows;
      try {
        rows = await influxDb.collectRows(query);
      } catch (error) {
        console.error("InfluxDB query error:", error);
        return metaData;
      }

      const res = siteStatisticsRowSchema.array().safeParse(rows);
      if (!res.success) {
        console.error(res.error);
        return metaData;
      }

      for (const row of res.data) {
        metaData.values[row.period] ??= {};
        metaData.values[row.period][row._field] = {
          value: row._value,
          lastUpdate: row._time,
        };
      }

      return metaData;
    }),
};
