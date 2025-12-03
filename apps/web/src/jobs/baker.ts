import Baker from "cronbake";

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
