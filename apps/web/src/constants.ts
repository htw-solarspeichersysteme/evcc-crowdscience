export const instanceCountsAsActiveDays = 30;

export const getTimeRangeDefaults = () => ({
  start: +new Date() - 7 * 24 * 60 * 60 * 1000,
  end: +new Date(),
  windowMinutes: 10,
});

const chartColors = [
  {
    stroke: "hsl(302 73% 39%)",
    fill: "hsl(302 73% 39% / 0.3)",
    rawHsl: "302 73% 39%",
  },
  {
    stroke: "hsl(204, 73%, 39%)",
    fill: "hsl(204 73% 39% / 0.3)",
    rawHsl: "204 73% 39%",
  },
  {
    stroke: "hsl(173 80% 39%)",
    fill: "hsl(173 80% 39% / 0.3)",
    rawHsl: "173 80% 39%",
  },
  {
    stroke: "hsl(242, 73%, 39%)",
    fill: "hsl(242 73% 39% / 0.3)",
    rawHsl: "242 73% 39%",
  },
  {
    stroke: "hsl(300, 80%, 60%)",
    fill: "hsl(325 90% 60% / 0.3)",
    rawHsl: "338 80% 43%",
  },

  {
    stroke: "hsl(160 90% 29%)",
    fill: "hsl(160 90% 29% / 0.3)",
    rawHsl: "160 90% 29%",
  },
  {
    stroke: "hsl(303, 34%, 25%)",
    fill: "hsl(303 34% 25% / 0.3)",
    rawHsl: "303 34% 25%",
  },

  {
    stroke: "hsl(204, 100%, 75%)",
    fill: "hsl(204 100% 75% / 0.3)",
    rawHsl: "204 100% 75%",
  },
] as const;

export const getChartColor = (index: number) =>
  chartColors[index % chartColors.length];
