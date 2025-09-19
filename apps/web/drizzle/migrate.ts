import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { env } from "~/env";

const sqlite = new Database(env.DATABASE_PATH);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: "./drizzle" });
