import Baker from "cronbake";

import { enrichInstancesMetadata } from "./enrichInstancesMetadata";

export const baker = new Baker({
  enableMetrics: true,
  schedulerConfig: {
    useCalculatedTimeouts: true,
    pollingInterval: 1000,
    maxHistoryEntries: 100,
  },
  persistence: {
    enabled: true,
    filePath: "./jobstate.json",
    autoRestore: false,
  },
});

baker.add({
  name: "enrich-instances-metadata",
  cron: "@every_minute",
  start: true,
  overrunProtection: true,
  callback: enrichInstancesMetadata,
  persist: true,
});

if (import.meta.main) {
  console.log("Starting jobs");
  void baker.bakeAll();
  setInterval(() => {
    void baker.saveState();
  }, 60 * 1000);
}
