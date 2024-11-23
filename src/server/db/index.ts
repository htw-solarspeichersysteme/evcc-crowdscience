import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  client: Database | undefined;
};

let client: Database;
try {
  client = new Database(env.DATABASE_PATH, { create: true });
} catch (error) {
  console.error(error);
  client = new Database(":memory:", { create: true });
}

if (env.NODE_ENV !== "production") globalForDb.client = client;

export { client };

export const db = drizzle(client, { schema });
