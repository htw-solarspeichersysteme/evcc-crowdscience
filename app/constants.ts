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
  start: +new Date() - 7 * 24 * 60 * 60 * 1000,
  end: +new Date(),
  windowMinutes: 10,
});

export const chartColors = [
  {
    stroke: "hsl(302 73% 39%)",
    fill: "hsl(302 73% 39% / 0.3)",
    rawHsl: "302 73% 39%",
  },
  {
    stroke: "hsl(173 58% 39%)",
    fill: "hsl(173 58% 39% / 0.3)",
    rawHsl: "173 58% 39%",
  },
  {
    stroke: "hsl(210 69% 42%)",
    fill: "hsl(210 69% 42% / 0.3)",
    rawHsl: "210 69% 42%",
  },
  {
    stroke: "hsl(20 69% 42%)",
    fill: "hsl(20 69% 42% / 0.3)",
    rawHsl: "20 69% 42%",
  },
  {
    stroke: "hsl(352 73% 39%)",
    fill: "hsl(352 73% 39% / 0.3)",
    rawHsl: "352 73% 39%",
  },
  {
    stroke: "hsl(60 50% 39%)",
    fill: "hsl(60 50% 39% / 0.3)",
    rawHsl: "60 50% 39%",
  },
  {
    stroke: "hsl(120 50% 39%)",
    fill: "hsl(120 50% 39% / 0.3)",
    rawHsl: "120 50% 39%",
  },
  {
    stroke: "hsl(90 300% 39%)",
    fill: "hsl(90 300% 39% / 0.3)",
    rawHsl: "90 300% 39%",
  },
] as const;

export const getChartColor = (index: number) =>
  chartColors[index % chartColors.length];
