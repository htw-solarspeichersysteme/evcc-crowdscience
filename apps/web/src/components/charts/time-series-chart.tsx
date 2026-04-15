import { useQueries } from "@tanstack/react-query";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";

import { getChartColor, sharedChartOptions } from "~/constants";
import { useTimeSeriesSettings } from "~/hooks/use-timeseries-settings";
import type { TimeSeriesConfig } from "~/lib/globalSchemas";
import { possibleMeasurementsConfig } from "~/lib/time-series-config";
import { cn, formatUnit } from "~/lib/utils";
import { orpc } from "~/orpc/client";
import {
  type CsvImportLoadingSession,
  type ExtractedSession,
} from "~/orpc/loadingSessions/types";
import type { Gap } from "~/orpc/timeSeries/types";
import type { MetaData } from "~/orpc/types";
import { LoadingSpinnerCard } from "../loading-spinner-card";
import { SeriesConfigurator } from "../series-configurator";
import { Card, CardContent } from "../ui/card";
import {
  formatSessionMarkTooltip,
  importedSessionShortLabel,
  SESSION_MARK_TOOLTIP_BASE,
} from "./time-series-session-tooltips";

const OVERLAY_SERIES_NAMES = new Set([
  "Imported Sessions",
  "Extracted Sessions",
  "Sending Activity",
]);

const { top: MAIN_TOP, bottom: MAIN_BOTTOM } = sharedChartOptions.grid as {
  top: number;
  bottom: number;
};

function clipTimeRange(
  start: number,
  end: number,
  rangeStart: number,
  rangeEnd: number,
): readonly [number, number] | null {
  const a = Math.max(start, rangeStart);
  const b = Math.min(end, rangeEnd);
  if (a >= b) return null;
  return [a, b];
}

function formatWithSiPrefix(unit: string): boolean {
  if (unit === "%" || unit.length === 0) return false;
  return true;
}

export function InstanceTimeSeriesEcharts({
  instanceId,
  series,
  onSeriesChange,
  className,
  importedSessions,
  extractedSessions,
  gaps,
  pvMetaData,
  loadPointMetaData,
  batteryMetaData,
  vehicleMetaData,
}: {
  instanceId: string;
  series: TimeSeriesConfig[];
  onSeriesChange: (series: TimeSeriesConfig[]) => void;
  className?: string;
  importedSessions?: CsvImportLoadingSession[];
  extractedSessions?: ExtractedSession[];
  gaps?: Gap[];
  pvMetaData?: MetaData;
  loadPointMetaData?: MetaData;
  batteryMetaData?: MetaData;
  vehicleMetaData?: MetaData;
}) {
  const { timeRange } = useTimeSeriesSettings();

  const queries = useQueries({
    queries: series.map((s) =>
      orpc.timeSeries.getData.queryOptions({
        input: {
          measurement: s.measurement,
          instanceId,
          timeRange,
          field: s.field,
          componentId: s.componentId,
        },
      }),
    ),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isFetching = queries.some((q) => q.isFetching);
  const hasData = queries.some((q) => q.data?.length && q.data.length > 0);

  const unitBySeriesName: Record<string, string> = {};
  const unitsInOrder: string[] = [];

  const registerUnit = (unit: string) => {
    if (!unitsInOrder.includes(unit)) unitsInOrder.push(unit);
    return unitsInOrder.indexOf(unit);
  };

  const yAxisLine = {
    axisLine: {
      lineStyle: {
        color: "#999",
      },
    },
  };

  const yAxisSplitLinePrimary = {
    splitLine: {
      show: true,
      lineStyle: {
        type: "dashed" as const,
        color: "#eee",
      },
    },
  };

  const dataSeries: echarts.SeriesOption[] = queries.flatMap(
    (query, queryIndex) => {
      const config = series[queryIndex];
      const measurementConfig = possibleMeasurementsConfig[config.measurement];

      return (query.data ?? []).map((table, tableIndex) => {
        const fieldConfig = measurementConfig?.fields[table.field];
        const unit = fieldConfig?.unit ?? "";

        const seriesGlobalIndex = queryIndex * 10 + tableIndex;
        const color = getChartColor(seriesGlobalIndex);

        const nameParts: string[] = [];

        if (measurementConfig?.label) {
          nameParts.push(measurementConfig.label);
        }

        if (table.metadata.componentId)
          nameParts.push(`Component: ${table.metadata.componentId}`);

        const label = fieldConfig?.label ?? table.field;
        nameParts.push(label);

        const name = nameParts.join(" - ");
        unitBySeriesName[name] = unit;
        const yAxisIndex = registerUnit(unit);

        const baseSeries = {
          name,
          xAxisIndex: 0,
          yAxisIndex,
          z: 2,
          itemStyle: {
            color: color.stroke,
          },
          data: table.data,
        } satisfies echarts.SeriesOption;

        const lineSeries = {
          ...baseSeries,
          type: "line",
          showSymbol: false,
          connectNulls: false,
          lineStyle: {
            width: 2,
            color: color.stroke,
          },
          areaStyle: {
            opacity: 0.3,
            color: color.fill,
          },
          emphasis: {
            focus: "series",
            lineStyle: {
              color: color.stroke,
            },
            areaStyle: {
              opacity: 0.3,
              color: color.fill,
            },
          },
          blur: {
            areaStyle: {
              opacity: 0.1,
            },
            lineStyle: {
              opacity: 0.3,
            },
          },
        } satisfies echarts.SeriesOption;

        const scatterSeries = {
          ...baseSeries,
          type: "scatter",
          symbol: "circle",
          symbolSize: 6,
          selectedMode: "single",
          emphasis: {
            focus: "self",
            scale: 1.5,
          },
        } satisfies echarts.SeriesOption;

        return timeRange.windowMinutes > 14 ? lineSeries : scatterSeries;
      });
    },
  );

  const mainYAxisList: NonNullable<EChartsOption["yAxis"]> = unitsInOrder.map(
    (unit, idx) => ({
      type: "value" as const,
      gridIndex: 0,
      scale: true,
      position: idx === 0 ? ("left" as const) : ("right" as const),
      offset: idx >= 2 ? (idx - 1) * 64 : 0,
      name: unit || undefined,
      nameTextStyle: {
        color: "#666",
        fontSize: 11,
      },
      axisLabel: {
        formatter: (value: number) =>
          unit
            ? formatUnit(value, unit, 2, formatWithSiPrefix(unit))
            : String(value),
      },
      ...yAxisLine,
      ...(idx === 0 ? yAxisSplitLinePrimary : { splitLine: { show: false } }),
    }),
  );

  const sessionStripY = {
    type: "value" as const,
    gridIndex: 1,
    min: 0,
    max: 1,
    show: false,
  };

  const yAxis: EChartsOption["yAxis"] =
    unitsInOrder.length === 0
      ? [
          {
            type: "value",
            gridIndex: 0,
            scale: true,
            axisLabel: {
              formatter: (value: number) => String(value),
            },
            ...yAxisLine,
            ...yAxisSplitLinePrimary,
          },
          sessionStripY,
        ]
      : [...mainYAxisList, sessionStripY];

  const sessionYAxisIndex = unitsInOrder.length;

  const gridRight =
    unitsInOrder.length <= 1 ? 10 : 10 + (unitsInOrder.length - 1) * 56;

  const plotX = { left: 48, right: gridRight };

  const grid: EChartsOption["grid"] = [
    {
      ...plotX,
      top: MAIN_TOP,
      bottom: MAIN_BOTTOM,
      containLabel: false,
      tooltip: { show: true, trigger: "axis" },
    },
    {
      ...plotX,
      top: MAIN_TOP - 10,
      height: 10,
      tooltip: { show: true, trigger: "item" },
    },
  ];

  const xAxisTime = {
    type: "time" as const,
    min: timeRange.start,
    max: timeRange.end,
    axisLine: {
      lineStyle: { color: "#999" },
    },
  };

  const xAxisLabelFmt = {
    year: "{yyyy}",
    month: "{MMM}",
    day: "{MMM} {d}",
    hour: "{HH}:{mm}",
    minute: "{HH}:{mm}",
    second: "{HH}:{mm}:{ss}",
  };

  const xAxis: EChartsOption["xAxis"] = [
    {
      ...xAxisTime,
      gridIndex: 0,
      axisLabel: {
        formatter: xAxisLabelFmt,
        hideOverlap: true,
        rotate: 0,
      },
      splitLine: {
        show: true,
        lineStyle: { type: "dashed" as const, color: "#eee" },
      },
    },
    {
      ...xAxisTime,
      gridIndex: 1,
      axisLabel: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLine: { show: false },
    },
  ];

  const option: EChartsOption = {
    ...sharedChartOptions,
    toolbox: {
      ...sharedChartOptions.toolbox,
      right: 10,
      top: -10,
    },
    grid,
    legend: { show: false },
    tooltip: {
      trigger: "axis",
      triggerOn: "mousemove",
      confine: true,
      axisPointer: {
        type: "cross",
        animation: false,
        label: {
          backgroundColor: "#6a7985",
        },
      },
      backgroundColor: "rgba(255, 255, 255, 0.97)",
      borderColor: "#e2e8f0",
      borderWidth: 1,
      extraCssText:
        "border-radius:10px;box-shadow:0 4px 14px rgba(15,23,42,0.08);padding:8px 10px",
      textStyle: {
        color: "#333",
      },
      formatter: (params) => {
        if (!Array.isArray(params) || params.length === 0) return "";
        const first = params[0] as { axisValue?: number | string };
        const axisValue = first?.axisValue;
        const timeLabel =
          typeof axisValue === "number"
            ? new Date(axisValue).toLocaleString()
            : String(axisValue ?? "");
        const lines = params
          .filter((p) => !OVERLAY_SERIES_NAMES.has(String(p.seriesName ?? "")))
          .map((p) => {
            const sName = String(p.seriesName ?? "");
            const u = unitBySeriesName[sName] ?? "";
            const raw = Array.isArray(p.value) ? p.value[1] : p.value;
            const marker = typeof p.marker === "string" ? p.marker : "";
            if (raw == null || raw === "") {
              return `${marker}${sName}: --`;
            }
            if (typeof raw !== "number") {
              return `${marker}${sName}: ${typeof raw === "object" ? JSON.stringify(raw) : String(raw)}`;
            }
            return `${marker}${sName}: ${formatUnit(raw, u, 2, formatWithSiPrefix(u))}`;
          });
        return [timeLabel, ...lines].join("<br/>");
      },
    },
    dataZoom: [
      {
        type: "inside",
        xAxisIndex: [0, 1],
        zoomOnMouseWheel: "shift",
      },
      {
        type: "slider",
        xAxisIndex: [0, 1],
        showDataShadow: true,
        left: plotX.left,
        right: plotX.right,
        startValue: timeRange.start,
        endValue: timeRange.end,
      },
    ],
    xAxis,
    yAxis,
    series: [
      {
        name: "Imported Sessions",
        type: "line",
        xAxisIndex: 1,
        yAxisIndex: sessionYAxisIndex,
        z: 2,
        data: [],
        markArea: {
          tooltip: {
            ...SESSION_MARK_TOOLTIP_BASE,
            formatter: (params) => formatSessionMarkTooltip(params, "imported"),
          },
          label: { show: false },
          emphasis: {
            itemStyle: {
              color: "rgba(22, 163, 74, 0.5)",
              borderColor: "rgba(21, 128, 61, 0.35)",
              borderWidth: 0,
              borderRadius: 3,
            },
          },
          data: (importedSessions ?? []).flatMap((session) => {
            const clipped = clipTimeRange(
              session.startTime,
              session.endTime,
              timeRange.start,
              timeRange.end,
            );
            if (!clipped) return [];
            return [
              [
                {
                  name: importedSessionShortLabel(session),
                  xAxis: clipped[0],
                  yAxis: 0.06,
                  importedSession: session,
                  itemStyle: {
                    color: "rgba(34, 197, 94, 0.34)",
                    borderColor: "rgba(21, 128, 61, 0.35)",
                    borderWidth: 0,
                    borderRadius: 3,
                  },
                },
                { xAxis: clipped[1], yAxis: 0.94 },
              ],
            ];
          }),
        },
      },
      {
        name: "Extracted Sessions",
        type: "line",
        xAxisIndex: 1,
        yAxisIndex: sessionYAxisIndex,
        z: 3,
        data: [],
        markArea: {
          tooltip: {
            ...SESSION_MARK_TOOLTIP_BASE,
            formatter: (params) =>
              formatSessionMarkTooltip(params, "extracted"),
          },
          label: { show: false },
          emphasis: {
            itemStyle: {
              color: "rgba(21, 128, 61, 0.55)",
              borderColor: "rgba(21, 128, 61, 0.42)",
              borderWidth: 0,
              borderRadius: 3,
            },
          },
          data: (extractedSessions ?? []).flatMap((session) => {
            const clipped = clipTimeRange(
              session.startTime,
              session.endTime,
              timeRange.start,
              timeRange.end,
            );
            if (!clipped) return [];
            return [
              [
                {
                  name: "",
                  xAxis: clipped[0],
                  yAxis: 0.06,
                  itemStyle: {
                    color: "rgba(22, 163, 74, 0.4)",
                    borderColor: "rgba(21, 128, 61, 0.42)",
                    borderWidth: 0,
                    borderRadius: 3,
                  },
                  session,
                },
                { xAxis: clipped[1], yAxis: 0.94 },
              ],
            ];
          }),
        },
      },
      ...dataSeries,
      {
        name: "Sending Activity",
        type: "line",
        xAxisIndex: 0,
        yAxisIndex: 0,
        z: 1,
        markArea: {
          label: { show: false },
          emphasis: { disabled: true },
          data: gaps?.flatMap((gap) => {
            const clipped = clipTimeRange(
              gap.start,
              gap.end,
              timeRange.start,
              timeRange.end,
            );
            if (!clipped) return [];
            return [
              [
                {
                  xAxis: clipped[0],
                  itemStyle: {
                    color: "rgba(239, 68, 68, 0.08)",
                    borderWidth: 0,
                  },
                },
                { xAxis: clipped[1] },
              ],
            ];
          }),
        },
      } as const,
    ],
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardContent className="relative aspect-video max-h-[1000px] min-h-[300px] grow p-6">
        {isLoading && <LoadingSpinnerCard message="Loading chart data" />}
        {hasData ? (
          <ReactECharts
            option={option}
            onChartReady={(instance) => {
              instance.group = "time-series";
              echarts.connect("time-series");
            }}
            autoResize={true}
            style={{ height: "100%", width: "100%" }}
            notMerge={true}
            lazyUpdate={true}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            {isLoading || isFetching
              ? "Loading..."
              : series.length === 0
                ? "No series configured"
                : "No data available"}
          </div>
        )}
      </CardContent>
      <SeriesConfigurator
        series={series}
        onChange={onSeriesChange}
        pvMetaData={pvMetaData}
        loadPointMetaData={loadPointMetaData}
        batteryMetaData={batteryMetaData}
        vehicleMetaData={vehicleMetaData}
      />
    </Card>
  );
}
