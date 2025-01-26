import { useMemo } from "react";

import type { WindowedTimeSeriesData } from "~/lib/globalSchemas";
import { cn } from "~/lib/utils";
import {
  ResponsiveUplot,
  type ResponsiveUplotProps,
} from "../u-plot/responsive-uplot";
import { timelinePlugin } from "../u-plot/timeline-plugin";

export function StateTimelineChart({
  data,
  heightConfig,
  className,
}: {
  data: WindowedTimeSeriesData<boolean | null>[];
  heightConfig?: ResponsiveUplotProps["heightConfig"];
  className?: string;
}) {
  const modifiedData = useMemo(() => {
    return data.reduce(
      (acc, d) => {
        acc[0].push(d.startTimeStamp / 1000);
        acc[1].push(d.value ? 1 : 0);
        return acc;
      },
      [[], []] as [number[], number[]],
    );
  }, [data]);
  return (
    <ResponsiveUplot
      data={modifiedData}
      className={cn("grow", className)}
      heightConfig={heightConfig}
      options={{
        axes: [
          {
            show: false,
          },
          {
            show: false,
          },
        ],
        legend: {
          show: false,
        },
        padding: [null, 0, 0, 0],
        series: [
          {
            label: "Time",
          },
          {
            label: "Activity",
            stroke: "darkgreen",
            width: 0,
            value: (_, rawValue) =>
              rawValue === 0 ? "No Data" : "Data received",
          },
        ],
        cursor: {
          sync: {
            key: "time",
          },
          show: true,
        },
        plugins: [
          timelinePlugin({
            mode: 1,
            size: [1, 1000],
            count: 1,
            fill: (_, dataIdx, value) =>
              value === 1 ? "hsl(173 58% 39%)" : "hsl(302 73% 39%)",
            stroke: (_, dataIdx, value) =>
              value === 1 ? "hsl(173 58% 39%)" : "hsl(302 73% 39%)",
            width: 4,
          }),
        ],
      }}
    />
  );
}
