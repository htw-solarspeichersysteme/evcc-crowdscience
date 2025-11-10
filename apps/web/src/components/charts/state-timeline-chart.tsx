import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import type { AlignedData } from "uplot";

import { cn } from "~/lib/utils";

export function StateTimelineChart({
  data,
  className,
  timeRange,
}: {
  data: AlignedData;
  className?: string;
  connectGroup?: string;
  timeRange?: { start: number; end: number };
}) {
  const option: EChartsOption = useMemo(() => {
    const timestamps = Array.from(data[0]);
    const values = Array.from(data[1]);

    if (timestamps.length === 0) {
      return {
        xAxis: { type: "time", show: false },
        yAxis: { type: "value", show: false },
        series: [],
      };
    }

    const start = timeRange?.start ?? Math.min(...timestamps) * 1000;
    const end = timeRange?.end ?? Math.max(...timestamps) * 1000;

    return {
      animation: false,
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
      xAxis: {
        type: "time",
        show: false,
        min: start,
        max: end,
      },
      yAxis: {
        type: "value",
        show: false,
        min: 0,
        max: 1,
      },
      tooltip: {
        trigger: "axis",
        triggerOn: "mousemove",
        axisPointer: {
          type: "line",
        },
      },
      series: [
        {
          type: "custom",
          coordinateSystem: "cartesian2d",
          data: timestamps.map((timestamp, index) => [
            timestamp * 1000,
            values[index] ?? 0,
          ]),
          renderItem: (params, api) => {
            const dataIndex = params.dataIndex;
            const startTimestamp = api.value(0, dataIndex);
            const endTimestamp = api.value(0, dataIndex + 1);
            const value = values[dataIndex] ?? 0;

            const size = api.size?.([0, 1]);
            const height = Array.isArray(size) ? size[1] : 100;
            const start =
              dataIndex === 0 ? 0 : api.coord([startTimestamp, 0])[0];
            const end = api.coord([endTimestamp, 1])[0];
            const color = value === 1 ? "hsl(173 58% 39%)" : "hsl(18 60% 57%)";
            return {
              type: "rect",
              shape: {
                x: start,
                y: 0,
                width: end - start + 1,
                height,
              },
              style: { fill: color },
              z: 10,
              z2: 10,
            };
          },
        },
      ],
    } satisfies EChartsOption;
  }, [data, timeRange]);

  return (
    <div className={cn("shrink-0", className)}>
      <ReactECharts
        option={option}
        onChartReady={(instance) => {
          instance.group = "time-series";
          echarts.connect("time-series");
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
        opts={{
          renderer: "canvas",
        }}
      />
    </div>
  );
}
