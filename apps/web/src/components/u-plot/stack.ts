import type { AlignedData, Band } from "uplot";

/**
 * Stacks data series and creates bands between adjacent series
 */
export function stack(
  data: AlignedData,
  omit?: (seriesIndex: number) => boolean,
): {
  data: AlignedData;
  bands: Band[];
} {
  const [xValues, ...ySeries] = data;
  const runningTotals = Array<number>(xValues.length).fill(0);

  const stackedSeries = ySeries.map((series, i) =>
    omit?.(i + 1)
      ? series
      : series.map((val, j) => {
          if (val === null) return 0;
          return (runningTotals[j] += Number(val));
        }),
  );

  const bands = ySeries
    .map((_, i) => {
      if (omit?.(i + 1)) return null;
      const nextIdx = ySeries.findIndex((_, j) => j > i && !omit?.(j + 1));
      return nextIdx !== -1 ? { series: [nextIdx + 1, i + 1] } : null;
    })
    .filter((band): band is Band => band !== null);

  return {
    data: [xValues, ...stackedSeries],
    bands,
  };
}
