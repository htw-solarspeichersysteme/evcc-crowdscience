import { sqliteGenerate } from "drizzle-dbml-generator";

import * as schema from "~/db/schema";

sqliteGenerate({
  schema,
  out: "drizzle/db.dbml",
});
