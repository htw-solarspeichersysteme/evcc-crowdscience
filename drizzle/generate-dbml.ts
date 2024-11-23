import { sqliteGenerate } from "drizzle-dbml-generator";
import * as schema from "../src/server/db/schema";

sqliteGenerate({
  schema,
  out: "drizzle/db.dbml",
});
