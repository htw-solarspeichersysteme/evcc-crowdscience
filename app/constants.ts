export const instanceCountsAsActiveDays = 30;

export const possibleInstanceTimeSeriesMetrics = [
  "batterySoc",
  "batteryPower",
  "pvPower",
  "gridPower",
  "homePower",
  "greenShareHome",
  "greenShareLoadpoints",
] as const;

export const getTimeRangeDefaults = () => ({
  start: new Date().setHours(0, 0, 0, 0) - 7 * 24 * 60 * 60 * 1000,
  end: +new Date(),
  windowMinutes: 10,
});
