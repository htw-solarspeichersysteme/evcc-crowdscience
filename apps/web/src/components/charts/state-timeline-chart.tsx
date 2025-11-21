import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";

import { cn } from "~/lib/utils";
import type { Gap } from "~/orpc/timeSeries/types";

export function StateTimelineChart({
  gaps,
  className,
  timeRange,
}: {
  gaps?: Gap[];
  className?: string;
  timeRange?: { start: number; end: number };
}) {
  const option: EChartsOption = useMemo(() => {
    return {
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
      xAxis: {
        type: "time",
        show: false,
        min: timeRange?.start,
        max: timeRange?.end,
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
      backgroundColor: "hsl(173 58% 39%)",
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: 0,
          zoomOnMouseWheel: "shift",
        },
      ],
      series: [
        {
          type: "line",
          markArea: {
            tooltip: { show: false },
            emphasis: { disabled: true },
            data: gaps?.map((gap) => [
              {
                xAxis: gap.start.getTime(),
                itemStyle: { color: "hsl(18 60% 57%)" },
              },
              { xAxis: gap.end.getTime() },
            ]),
          },
        },
      ],
    } satisfies EChartsOption;
  }, [gaps, timeRange]);

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
