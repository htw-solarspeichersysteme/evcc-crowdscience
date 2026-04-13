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
import { getSessionUrl } from "~/orpc/loadingSessions/helpers";
import {
  extractedSessionSchema,
  type CsvImportLoadingSession,
  type ExtractedSession,
} from "~/orpc/loadingSessions/types";
import type { Gap } from "~/orpc/timeSeries/types";
import type { MetaData } from "~/orpc/types";
import { LoadingSpinnerCard } from "../loading-spinner-card";
import { SeriesConfigurator } from "../series-configurator";
import { Card, CardContent } from "../ui/card";

const OVERLAY_SERIES_NAMES = new Set([
  "Imported Sessions",
  "Extracted Sessions",
  "Sending Activity",
]);

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

  function handleChartClick(params: echarts.ECElementEvent) {
    if (params.componentType === "markArea") {
      const sessionParseResult = extractedSessionSchema.safeParse(
        // @ts-expect-error we added the session to the data
        params.data?.session,
      );
      if (sessionParseResult.success) {
        // window.open(getSessionRangeUrl(sessionParseResult.data), "_blank");
        window.open(getSessionUrl(sessionParseResult.data), "_blank");
      }
    }
  }

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
          yAxisIndex,
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
        } as const satisfies echarts.SeriesOption;

        return timeRange.windowMinutes > 0 ? lineSeries : scatterSeries;
      });
    },
  );

  const yAxis: EChartsOption["yAxis"] =
    unitsInOrder.length === 0
      ? {
          type: "value",
          scale: true,
          axisLabel: {
            formatter: (value: number) => String(value),
          },
          ...yAxisLine,
          ...yAxisSplitLinePrimary,
        }
      : unitsInOrder.map((unit, idx) => ({
          type: "value" as const,
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
          ...(idx === 0
            ? yAxisSplitLinePrimary
            : { splitLine: { show: false } }),
        }));

  const gridRight =
    unitsInOrder.length <= 1 ? 10 : 10 + (unitsInOrder.length - 1) * 56;

  const option: EChartsOption = {
    ...sharedChartOptions,
    grid: {
      ...sharedChartOptions.grid,
      right: gridRight,
    },
    tooltip: {
      trigger: "axis",
      triggerOn: "mousemove",
      axisPointer: {
        type: "cross",
        animation: false,
        label: {
          backgroundColor: "#6a7985",
        },
      },
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#ccc",
      borderWidth: 1,
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
        xAxisIndex: 0,
        zoomOnMouseWheel: "shift",
      },
      {
        type: "slider",
        xAxisIndex: 0,
        startValue: timeRange.start,
        endValue: timeRange.end,
      },
    ],
    xAxis: {
      type: "time",
      min: timeRange.start,
      max: timeRange.end,
      axisLabel: {
        formatter: {
          year: "{yyyy}",
          month: "{MMM}",
          day: "{MMM} {d}",
          hour: "{HH}:{mm}",
          minute: "{HH}:{mm}",
          second: "{HH}:{mm}:{ss}",
        },
        hideOverlap: true,
        rotate: 0,
      },
      axisLine: {
        lineStyle: {
          color: "#999",
        },
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: "dashed",
          color: "#eee",
        },
      },
    },
    yAxis,
    series: [
      ...dataSeries,
      {
        name: "Imported Sessions",
        type: "line",
        yAxisIndex: 0,
        markArea: {
          data: importedSessions?.map(
            (session) =>
              [
                {
                  name: `${session.loadpoint} ${session.vehicle} ${formatUnit(session.energy, "kWh")}`,
                  xAxis: session.startTime,
                  itemStyle: {
                    color: "rgba(34, 197, 94, 0.3)",
                    borderColor: "rgba(34, 197, 94, 0.5)",
                    borderWidth: 1,
                  },
                },
                {
                  xAxis: session.endTime,
                },
              ] as const,
          ),
        },
      },
      {
        name: "Extracted Sessions",
        type: "line",
        yAxisIndex: 0,
        markArea: {
          data: extractedSessions?.map(
            (session) =>
              [
                {
                  name: `${session.componentId}`,
                  xAxis: session.startTime,
                  itemStyle: {
                    color: "rgba(239, 68, 68, 0.3)",
                    borderColor: "rgba(239, 68, 68, 0.5)",
                    borderWidth: 1,
                  },
                  session,
                },
                {
                  xAxis: session.endTime,
                },
              ] as const,
          ),
        },
      },
      {
        name: "Sending Activity",
        type: "line",
        yAxisIndex: 0,
        markArea: {
          emphasis: { disabled: true },
          data: gaps?.map((gap) => {
            return [
              {
                xAxis: gap.start,
                itemStyle: {
                  color: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.1)",
                  borderWidth: 1,
                },
              },
              { xAxis: gap.end },
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
              instance.on("click", handleChartClick);
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
