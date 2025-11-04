"use server";

import { Database } from "bun:sqlite";
import { InfluxDB } from "@influxdata/influxdb-client";
import { drizzle } from "drizzle-orm/bun-sqlite";

import * as schema from "~/db/schema";
import { env } from "~/env";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  sqliteClient: Database | undefined;
  influxClient: InfluxDB | undefined;
};

let sqliteClient: Database;
try {
  sqliteClient = new Database(env.DATABASE_PATH, { create: true });
} catch (error) {
  console.error(error);
  sqliteClient = new Database(":memory:", { create: true });
}

const influxClient = new InfluxDB({
  url: env.INFLUXDB_URL,
  token: env.INFLUXDB_TOKEN,
});

if (env.NODE_ENV !== "production") {
  globalForDb.sqliteClient = sqliteClient;
  globalForDb.influxClient = influxClient;
}

export const sqliteDb = drizzle({
  client: sqliteClient,
  schema,
});
export const influxDb = influxClient.getQueryApi(env.INFLUXDB_ORG);
