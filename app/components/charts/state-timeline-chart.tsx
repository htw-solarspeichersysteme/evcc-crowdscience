import { useMemo } from "react";

import type { WindowedTimeSeriesData } from "~/lib/globalSchemas";
import {
  ResponsiveUplot,
  type ResponsiveUplotProps,
} from "../u-plot/responsive-uplot";
import { timelinePlugin } from "../u-plot/timelinePlugin";

export function StateTimelineChart({
  data,
  heightConfig,
}: {
  data: WindowedTimeSeriesData<boolean | null>[];
  heightConfig?: ResponsiveUplotProps["heightConfig"];
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
      className="grow"
      heightConfig={heightConfig}
      options={{
        axes: [
          {
            show: false,
          },
          {
            show: true,
          },
        ],

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
