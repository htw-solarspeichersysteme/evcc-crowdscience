import { useRef, useState } from "react";
import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";

import { getChartColor } from "~/constants";
import { histogramWithBins } from "~/lib/utils";
import { getSessionUrl } from "~/orpc/loadingSessions/helpers";
import type { ExtractedSession } from "~/orpc/loadingSessions/types";
import { DashboardGraph } from "../dashboard-graph";

const startSocColor = getChartColor(1);
const endSocColor = getChartColor(2);

interface ChartCallbackParams {
  seriesName?: string;
  data?: [number, number] | { value: [number, number] };
}

export function ChargeSocHistogram({
  extractedSessions,
  className,
}: {
  className?: string;
  extractedSessions: ExtractedSession[];
}) {
  const chartRef = useRef<ReactECharts>(null);
  const [highlightRange, setHighlightRange] = useState<{
    type: "start" | "end";
    min: number;
    max: number;
  } | null>(null);

  const data = extractedSessions
    .map((session) => [session.startSoc, session.endSoc, session])
    .filter(
      (pair): pair is [number, number, ExtractedSession] =>
        pair[0] !== null && pair[1] !== null,
    );

  const binSize = 5;

  const startHistogram = histogramWithBins({
    data: data.map(([startSoc]) => startSoc),
    range: [0, 100],
    binSize,
  });

  const endHistogram = histogramWithBins({
    data: data.map(([_, endSoc]) => endSoc),
    range: [0, 100],
    binSize,
  });

  const scatterData = data.map(([startSoc, endSoc, session]) => {
    if (!highlightRange) {
      return {
        value: [startSoc, endSoc],
        itemStyle: { opacity: 0.7 },
        symbolSize: 8,
        session,
      };
    }
    const value = highlightRange.type === "start" ? startSoc : endSoc;
    const isInRange = value >= highlightRange.min && value < highlightRange.max;
    return {
      value: [startSoc, endSoc, session],
      itemStyle: {
        opacity: isInRange ? 1 : 0.08,
        color: isInRange
          ? highlightRange.type === "start"
            ? startSocColor.stroke
            : endSocColor.stroke
          : undefined,
      },
    };
  });

  const formatTooltip = (params: ChartCallbackParams): string => {
    if (params.seriesName === "SOC Scatter" && params.data) {
      const val = Array.isArray(params.data) ? params.data : params.data.value;
      return `<div style="font-weight: 500">Charging Session</div>
    
        <div style="display: flex; justify-content: space-between; gap: 16px">
          <span>Start SOC:</span><span style="font-weight: 600">${val[0]}%</span>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 16px">
          <span>End SOC:</span><span style="font-weight: 600">${val[1]}%</span>
        </div>`;
    }
    if (params.seriesName === "Start SOC" && params.data) {
      const val = Array.isArray(params.data) ? params.data : params.data.value;
      return `<div style="font-weight: 500">Start SOC: ${val[0]}-${val[0] + binSize}%</div>
        <div>${val[1]} sessions</div>`;
    }
    if (params.seriesName === "End SOC" && params.data) {
      const val = Array.isArray(params.data) ? params.data : params.data.value;
      return `<div style="font-weight: 500">End SOC: ${val[0]}-${val[0] + binSize}%</div>
        <div>${val[1]} sessions</div>`;
    }
    return "";
  };

  const option: EChartsOption = {
    animation: false,
    animationDuration: 150,
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "var(--popover)",
      borderColor: "var(--border)",
      textStyle: {
        color: "var(--popover-foreground)",
      },
      formatter: formatTooltip as (params: unknown) => string,
    },
    dataset: [{ source: startHistogram }, { source: endHistogram }],
    grid: [
      // Main scatter (bottom-left)
      {
        left: 55,
        right: "48%",
        top: "48%",
        bottom: 45,
        containLabel: false,
      },
      // Start SOC histogram (top)
      {
        left: 55,
        right: "48%",
        top: 30,
        bottom: "55%",
        containLabel: false,
      },
      // End SOC histogram (right)
      {
        left: "55%",
        right: 30,
        top: "48%",
        bottom: 45,
        containLabel: false,
      },
    ],
    xAxis: [
      // Scatter x-axis
      {
        type: "value",
        min: 0,
        max: 100,
        gridIndex: 0,
        name: "Start SOC (%)",
        nameLocation: "center",
        nameGap: 28,
        nameTextStyle: {
          color: startSocColor.stroke,
          fontWeight: 600,
          fontSize: 12,
        },
        axisLine: { lineStyle: { color: "hsl(var(--border))" } },
        axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
        splitLine: { lineStyle: { color: "hsl(var(--border))", opacity: 0.5 } },
      },
      // Start histogram x-axis (hidden, shares with scatter)
      {
        type: "category",
        gridIndex: 1,
        axisTick: { show: false },
        axisLabel: { show: false },
        axisLine: { show: false },
      },
      // End histogram x-axis (value for horizontal bars)
      {
        type: "value",
        gridIndex: 2,
        axisLine: { lineStyle: { color: "hsl(var(--border))" } },
        axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
        splitLine: { lineStyle: { color: "hsl(var(--border))", opacity: 0.3 } },
      },
    ],
    yAxis: [
      // Scatter y-axis
      {
        type: "value",
        min: 0,
        max: 100,
        gridIndex: 0,
        name: "End SOC (%)",
        nameLocation: "center",
        nameGap: 35,
        nameRotate: 90,
        nameTextStyle: {
          color: endSocColor.stroke,
          fontWeight: 600,
          fontSize: 12,
        },
        axisLine: { lineStyle: { color: "hsl(var(--border))" } },
        axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
        splitLine: { lineStyle: { color: "hsl(var(--border))", opacity: 0.5 } },
      },
      // Start histogram y-axis (count)
      {
        type: "value",
        gridIndex: 1,
        axisLine: { lineStyle: { color: "hsl(var(--border))" } },
        axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
        splitLine: { lineStyle: { color: "hsl(var(--border))", opacity: 0.3 } },
      },
      // End histogram y-axis (category for horizontal bars)
      {
        type: "category",
        gridIndex: 2,
        axisTick: { show: false },
        axisLabel: { show: false },
        axisLine: { show: false },
      },
    ],
    // @ts-expect-error we added the session to the data
    series: [
      // Scatter plot
      {
        name: "SOC Scatter",
        type: "scatter",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: scatterData,
        itemStyle: {
          color: "hsl(var(--muted-foreground))",
          borderWidth: 1,
          borderColor: "hsl(var(--background))",
        },
      },
      // Start SOC histogram (top)
      {
        name: "Start SOC",
        type: "bar",
        xAxisIndex: 1,
        yAxisIndex: 1,
        datasetIndex: 0,
        barWidth: "90%",
        itemStyle: {
          color: startSocColor.fill,
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: startSocColor.stroke,
          },
        },
        label: {
          show: true,
          position: "top",
          fontSize: 10,
          color: "hsl(var(--muted-foreground))",
          formatter: "{@[1]}",
        },
        encode: { x: 0, y: 1 },
      },
      // End SOC histogram (right, horizontal)
      {
        name: "End SOC",
        type: "bar",
        xAxisIndex: 2,
        yAxisIndex: 2,
        datasetIndex: 1,
        barWidth: "90%",
        itemStyle: {
          color: endSocColor.fill,
          borderRadius: [0, 4, 4, 0],
        },
        emphasis: {
          itemStyle: {
            color: endSocColor.stroke,
          },
        },
        label: {
          show: true,
          position: "right",
          fontSize: 10,
          color: "hsl(var(--muted-foreground))",
          formatter: "{@[1]}",
        },
        encode: { x: 1, y: 0 },
      },
    ],
  };

  const handleEvents = {
    mouseover: (params: ChartCallbackParams) => {
      if (params.seriesName === "Start SOC" && params.data) {
        const val = Array.isArray(params.data)
          ? params.data
          : params.data.value;
        setHighlightRange({
          type: "start",
          min: val[0],
          max: val[0] + binSize,
        });
      } else if (params.seriesName === "End SOC" && params.data) {
        const val = Array.isArray(params.data)
          ? params.data
          : params.data.value;
        setHighlightRange({
          type: "end",
          min: val[0],
          max: val[0] + binSize,
        });
      }
    },
    mouseout: (params: ChartCallbackParams) => {
      if (
        params.seriesName === "Start SOC" ||
        params.seriesName === "End SOC"
      ) {
        setHighlightRange(null);
      }
    },
    click: (params: ChartCallbackParams) => {
      console.log(params.data);
      if (params.data && "session" in params.data) {
        // @ts-expect-error we added the session to the data
        window.open(getSessionUrl(params.data.session), "_blank");
      }
    },
  };

  return (
    <DashboardGraph title="Charge SOC Distribution" className={className}>
      <div className="relative">
        <ReactECharts
          ref={chartRef}
          option={option}
          className="aspect-square"
          style={{ width: "100%", height: "100%" }}
          onEvents={handleEvents}
        />
        {/* Legend */}
        <div className="absolute top-0 right-4 flex gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div
              className="size-2.5 rounded-full"
              style={{ backgroundColor: startSocColor.stroke }}
            />
            <span className="text-muted-foreground">Start SOC</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="size-2.5 rounded-full"
              style={{ backgroundColor: endSocColor.stroke }}
            />
            <span className="text-muted-foreground">End SOC</span>
          </div>
        </div>
      </div>
    </DashboardGraph>
  );
}
