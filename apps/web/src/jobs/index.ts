import { sqliteDb } from "~/db/client";
import { internalOrpcClient } from "../orpc/internalClient";
import { baker } from "./baker";
import { enrichInstancesMetadata } from "./enrichInstancesMetadata";

export { baker };

baker.add({
  name: "enrich-instances-metadata",
  cron: "@every_minute",
  start: true,
  // immediate: true,
  overrunProtection: true,
  callback: enrichInstancesMetadata,
  persist: true,
});

baker.add({
  name: "extract-sessions",
  cron: "@hourly",
  // immediate: true,
  start: true,
  overrunProtection: true,
  callback: async () => {
    const allInstances = await sqliteDb.query.instances.findMany({
      columns: { id: true },
    });
    const instanceIds = allInstances.map((i) => i.id);
    console.log(
      `[jobs] Extracting sessions for ${instanceIds.length} instance(s)`,
    );
    await internalOrpcClient.jobs.extractAndSaveSessions({ instanceIds });
  },
  persist: true,
});

if (import.meta.main) {
  console.log("Starting jobs");
  void baker.bakeAll();
  setInterval(() => {
    void baker.saveState();
  }, 60 * 1000);
}
