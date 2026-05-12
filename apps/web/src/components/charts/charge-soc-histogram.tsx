import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";

import { getChartColor } from "~/constants";
import { histogramWithBins } from "~/lib/utils";
import type { ExtractedSession } from "~/orpc/loadingSessions/types";
import { DashboardGraph } from "../dashboard-graph";

const startSocColor = getChartColor(1);
const endSocColor = getChartColor(2);

interface ChartCallbackParams {
  seriesName?: string;
  data?:
    | [number, number]
    | [number, number, number, number, number]
    | { value: [number, number] }
    | { value: [number, number, number, number, number] };
}

type ChartTooltipParams = ChartCallbackParams | ChartCallbackParams[];

type BoxplotValues = [number, number, number, number, number];

function getBoxplotSummary(values: number[]) {
  return values.length === 6 ? values.slice(1) : values;
}

function formatNumber(value: number) {
  return value.toFixed(2);
}

function quantile(sortedValues: number[], percentile: number) {
  if (sortedValues.length === 0) return Number.NaN;

  const position = (sortedValues.length - 1) * percentile;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.min(lowerIndex + 1, sortedValues.length - 1);
  const weight = position - lowerIndex;

  return (
    sortedValues[lowerIndex] +
    (sortedValues[upperIndex] - sortedValues[lowerIndex]) * weight
  );
}

function buildBoxplotValues(values: number[]): BoxplotValues | null {
  if (values.length === 0) return null;

  const sortedValues = [...values].sort((left, right) => left - right);

  return [
    sortedValues[0],
    quantile(sortedValues, 0.25),
    quantile(sortedValues, 0.5),
    quantile(sortedValues, 0.75),
    sortedValues[sortedValues.length - 1],
  ];
}

export function ChargeSocHistogram({
  extractedSessions,
  className,
}: {
  className?: string;
  extractedSessions: ExtractedSession[];
}) {
  const data = extractedSessions
    .map((session) => [session.startSoc, session.endSoc, session])
    .filter(
      (pair): pair is [number, number, ExtractedSession] =>
        pair[0] !== null && pair[1] !== null,
    );

  const binSize = 5;

  const startValues = data.map(([startSoc]) => startSoc);
  const endValues = data.map(([_, endSoc]) => endSoc);

  const startHistogram = histogramWithBins({
    data: startValues,
    range: [0, 100],
    binSize,
  });

  const endHistogram = histogramWithBins({
    data: endValues,
    range: [0, 100],
    binSize,
  });

  const startBoxplot = buildBoxplotValues(startValues);
  const endBoxplot = buildBoxplotValues(endValues);

  const boxplotData = [
    startBoxplot && {
      name: "Start SOC",
      value: startBoxplot,
      itemStyle: {
        color: startSocColor.fill,
        borderColor: startSocColor.stroke,
      },
    },
    endBoxplot && {
      name: "End SOC",
      value: endBoxplot,
      itemStyle: {
        color: endSocColor.fill,
        borderColor: endSocColor.stroke,
      },
    },
  ].filter(Boolean) as {
    name: string;
    value: BoxplotValues;
    itemStyle: { color: string; borderColor: string };
  }[];

  const formatTooltip = (rawParams: ChartTooltipParams): string => {
    const params = Array.isArray(rawParams)
      ? (rawParams.find(
          (item) =>
            item.seriesName === "SOC Boxplot" ||
            item.seriesName === "Start SOC" ||
            item.seriesName === "End SOC",
        ) ?? rawParams[0])
      : rawParams;

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

    if (params.seriesName === "SOC Boxplot" && params.data) {
      const rawVal = Array.isArray(params.data)
        ? params.data
        : params.data.value;
      const val = getBoxplotSummary(rawVal);
      return `<div style="font-weight: 500">SOC Boxplot</div>
        <div style="display: flex; justify-content: space-between; gap: 16px"><span>Min:</span><span style="font-weight: 600">${formatNumber(val[0])}%</span></div>
        <div style="display: flex; justify-content: space-between; gap: 16px"><span>Q1:</span><span style="font-weight: 600">${formatNumber(val[1])}%</span></div>
        <div style="display: flex; justify-content: space-between; gap: 16px"><span>Median:</span><span style="font-weight: 600">${formatNumber(val[2])}%</span></div>
        <div style="display: flex; justify-content: space-between; gap: 16px"><span>Q3:</span><span style="font-weight: 600">${formatNumber(val[3])}%</span></div>
        <div style="display: flex; justify-content: space-between; gap: 16px"><span>Max:</span><span style="font-weight: 600">${formatNumber(val[4])}%</span></div>`;
    }

    return "";
  };

  const option: EChartsOption = {
    animation: false,
    animationDuration: 150,
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      backgroundColor: "var(--popover)",
      borderColor: "var(--border)",
      textStyle: {
        color: "var(--popover-foreground)",
      },
      formatter: formatTooltip as (params: unknown) => string,
    },
    dataset: [{ source: startHistogram }, { source: endHistogram }],
    grid: [
      {
        left: 55,
        right: "48%",
        top: "48%",
        bottom: 45,
        containLabel: false,
      },
      {
        left: 55,
        right: "48%",
        top: 30,
        bottom: "55%",
        containLabel: false,
      },
      {
        left: "55%",
        right: 30,
        top: "48%",
        bottom: 45,
        containLabel: false,
      },
    ],
    xAxis: [
      {
        type: "value",
        min: 0,
        max: 100,
        gridIndex: 0,
        name: "SOC (%)",
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
      {
        type: "category",
        gridIndex: 1,
        axisTick: { show: false },
        axisLabel: { show: false },
        axisLine: { show: false },
      },
      {
        type: "value",
        gridIndex: 2,
        axisLine: { lineStyle: { color: "hsl(var(--border))" } },
        axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
        splitLine: { lineStyle: { color: "hsl(var(--border))", opacity: 0.3 } },
      },
    ],
    yAxis: [
      {
        type: "category",
        gridIndex: 0,
        data: ["Start SOC", "End SOC"],
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "hsl(var(--border))" } },
        axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
      },
      {
        type: "value",
        gridIndex: 1,
        axisLine: { lineStyle: { color: "hsl(var(--border))" } },
        axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
        splitLine: { lineStyle: { color: "hsl(var(--border))", opacity: 0.3 } },
      },
      {
        type: "category",
        gridIndex: 2,
        axisTick: { show: false },
        axisLabel: { show: false },
        axisLine: { show: false },
      },
    ],
    series: [
      {
        name: "SOC Boxplot",
        type: "boxplot",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: boxplotData,
        boxWidth: [24, 48],
        itemStyle: {
          borderWidth: 1,
        },
      },
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

  return (
    <DashboardGraph title="Charge SOC Distribution" className={className}>
      <div className="relative">
        <ReactECharts
          option={option}
          className="aspect-square"
          style={{ width: "100%", height: "100%" }}
        />
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
