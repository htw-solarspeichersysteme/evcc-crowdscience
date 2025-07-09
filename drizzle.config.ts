import { type Config } from "drizzle-kit";

import { env } from "~/env";

export default {
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: env.DATABASE_PATH,
  },
  tablesFilter: ["octopoda_*"],
} satisfies Config;
