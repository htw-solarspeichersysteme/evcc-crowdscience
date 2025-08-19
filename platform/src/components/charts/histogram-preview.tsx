import { useMemo } from "react";
import uPlot from "uplot";

import { cn, histogram } from "~/lib/utils";
import { ResponsiveUplot } from "../u-plot/responsive-uplot";

export function HistogramPreview({
  data,
  range,
  binSize,
  className,
}: {
  data: number[];
  range: [number, number];
  binSize: number;
  className?: string;
}) {
  const histogramData = useMemo(
    () => histogram({ data, range, binSize }),
    [data, range, binSize],
  );

  return (
    <ResponsiveUplot
      heightConfig={{
        fixed: 20,
      }}
      className={cn("h-[20px]", className)}
      data={[
        Array.from(
          { length: histogramData.length },
          (_, i) => range[0] + i * binSize,
        ),
        histogramData,
      ]}
      options={{
        legend: {
          show: false,
        },
        cursor: {
          show: false,
        },
        axes: [
          {
            show: false,
          },
          {
            show: false,
          },
        ],
        scales: {
          x: {
            range,
            time: false,
          },
        },
        series: [
          {},
          {
            paths: uPlot.paths.bars!({
              align: 1,
              gap: 0,
              size: [1],
            }),
            fill: "hsl(173 58% 39% / 0.5)",
            stroke: "hsl(173 58% 39% / 0.5)",
            points: {
              show: false,
            },
          },
        ],
      }}
    />
  );
}
