import { InfluxDB } from "@influxdata/influxdb-client";

import { env } from "~/env";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  client: InfluxDB | undefined;
};

const client = new InfluxDB({
  url: env.INFLUXDB_URL,
  token: env.INFLUXDB_TOKEN,
});

if (env.NODE_ENV !== "production") globalForDb.client = client;

export { client };

export const influxDb = client.getQueryApi("octopoda");
