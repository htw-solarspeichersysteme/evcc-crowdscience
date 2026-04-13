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

  const option: EChartsOption = {
    ...sharedChartOptions,
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
    yAxis: {
      type: "value",
      scale: true,
      axisLabel: {
        formatter: (value) => value.toString(), // TODO: Improve unit formatting for mixed units
      },
      axisLine: {
        lineStyle: {
          color: "#999",
        },
      },
      splitLine: {
        lineStyle: {
          type: "dashed",
          color: "#eee",
        },
      },
    },
    series: [
      ...queries.flatMap((query, queryIndex) => {
        const config = series[queryIndex];
        const measurementConfig =
          possibleMeasurementsConfig[config.measurement];

        return (query.data ?? []).map((table, tableIndex) => {
          // Identify field config to get label and unit
          const fieldConfig = measurementConfig?.fields[table.field];

          // Global index for color stability (simple approximation)
          const seriesGlobalIndex = queryIndex * 10 + tableIndex;
          const color = getChartColor(seriesGlobalIndex);

          const nameParts: string[] = [];

          // Add measurement label if there are multiple measurements or to be explicit
          if (measurementConfig?.label) {
            nameParts.push(measurementConfig.label);
          }

          if (table.metadata.componentId)
            nameParts.push(`Component: ${table.metadata.componentId}`);

          const label = fieldConfig?.label ?? table.field;
          // Avoid redundancy if measurement label is same as field label (unlikely but safe)
          nameParts.push(label);

          const name = nameParts.join(" - ");

          const series = {
            name,
            itemStyle: {
              color: color.stroke,
            },
            data: table.data,
          } satisfies echarts.SeriesOption;

          const lineSeries = {
            ...series,
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
            ...series,
            type: "scatter",
          } as const satisfies echarts.SeriesOption;

          return timeRange.windowMinutes > 0 ? lineSeries : scatterSeries;
        });
      }),
      {
        name: "Imported Sessions",
        type: "line",
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
