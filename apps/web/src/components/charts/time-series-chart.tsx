import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { InferSelectModel } from "drizzle-orm";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";

import { getChartColor, sharedChartOptions } from "~/constants";
import type { csvImportLoadingSessions } from "~/db/schema";
import { useTimeSeriesSettings } from "~/hooks/use-timeseries-settings";
import { possibleChartTopicsConfig } from "~/lib/time-series-config";
import { cn, formatUnit } from "~/lib/utils";
import { orpc } from "~/orpc/client";
import {
  extractedSessionRangeSchema,
  type ExtractedSessionRange,
} from "~/orpc/loadingSessions/types";
import type { Gap } from "~/orpc/timeSeries/types";
import { LoadingSpinnerCard } from "../loading-spinner-card";
import { TimeSeriesSettingsPicker } from "../time-series-settings-picker";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Combobox } from "../ui/combo-box";

export function InstanceTimeSeriesEcharts({
  instanceId,
  chartTopic,
  chartTopicField,
  handleChartTopicChange,
  className,
  importedSessions,
  extractedSessions,
  gaps,
}: {
  instanceId: string;
  chartTopic: string;
  chartTopicField?: string;
  handleChartTopicChange: (
    chartTopic: string,
    chartTopicField?: string,
  ) => void;
  className?: string;
  importedSessions?: InferSelectModel<typeof csvImportLoadingSessions>[];
  extractedSessions?: ExtractedSessionRange[];
  gaps?: Gap[];
}) {
  const { timeRange } = useTimeSeriesSettings();
  const { data, isFetching, isLoading } = useQuery(
    orpc.timeSeries.getData.queryOptions({
      input: { chartTopic, instanceId, timeRange, chartTopicField },
    }),
  );

  function handleChartClick(params: echarts.ECElementEvent) {
    if (params.componentType === "markArea") {
      const sessionParseResult = extractedSessionRangeSchema.safeParse(
        // @ts-expect-error we added the session to the data
        params.data?.session,
      );
      if (sessionParseResult.success) {
        window.open(
          `/dashboard/instances/${instanceId}/session?componentId="${sessionParseResult.data.componentId.toString()}"&timeRange=${encodeURIComponent(
            JSON.stringify({
              start: sessionParseResult.data.startTime.getTime(),
              end: sessionParseResult.data.endTime.getTime(),
              windowMinutes: 0,
            }),
          )}`,
          "_blank",
        );
      }
    }
  }

  const fieldOptions = useMemo(() => {
    const options: Record<
      string,
      { value: string; label: string; unit?: string }
    > = {};

    for (const [key, value] of Object.entries(
      possibleChartTopicsConfig?.[chartTopic]?.fields,
    )) {
      options[key] ??= {
        value: key,
        label: value.label,
        unit: value?.unit,
      };
    }

    return Object.values(options);
  }, [chartTopic]);

  const fieldOption = fieldOptions.find(
    (option) => option.value === chartTopicField,
  );

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
        formatter: (value) =>
          fieldOption?.unit
            ? formatUnit(value, fieldOption.unit)
            : value.toString(),
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
      ...(data ?? []).map((table, index) => {
        const color = getChartColor(index);
        const nameParts: string[] = [];
        if (table.metadata.componentId)
          nameParts.push(`Component: ${table.metadata.componentId}`);
        const name =
          nameParts.length > 0
            ? nameParts.join(" ")
            : (fieldOption?.label ?? table.field);

        return {
          name,
          type: "line",
          showSymbol: false,
          connectNulls: false,
          lineStyle: {
            width: 2,
            color: color.stroke,
          },
          itemStyle: {
            color: color.stroke,
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
          data: table.data,
          areaStyle: {
            opacity: 0.3,
            color: color.fill,
          },
        } satisfies echarts.SeriesOption;
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
                  xAxis: session.startTime.getTime(),
                  itemStyle: {
                    color: "rgba(34, 197, 94, 0.3)",
                    borderColor: "rgba(34, 197, 94, 0.5)",
                    borderWidth: 1,
                  },
                },
                {
                  xAxis: session.endTime?.getTime(),
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
                  xAxis: session.startTime.getTime(),
                  itemStyle: {
                    color: "rgba(239, 68, 68, 0.3)",
                    borderColor: "rgba(239, 68, 68, 0.5)",
                    borderWidth: 1,
                  },
                  session,
                },
                {
                  xAxis: session.endTime?.getTime(),
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
          data: gaps?.map((gap) => [
            {
              xAxis: gap.start.getTime(),
              itemStyle: {
                color: "rgba(239, 68, 68, 0.5)",
                borderColor: "rgba(239, 68, 68, 0.5)",
                borderWidth: 1,
              },
            },
            { xAxis: gap.end.getTime() },
          ]),
        },
      } as const,
    ],
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-col gap-2">
        <TimeSeriesSettingsPicker className="col-span-3 lg:col-span-full" />
      </CardHeader>
      <CardContent className="relative aspect-video max-h-[1000px] min-h-[300px] grow">
        {isLoading && <LoadingSpinnerCard message="Loading chart data" />}
        {data?.length && data.length > 0 ? (
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
              : chartTopicField && fieldOptions.length === 0
                ? "No data available for selected field"
                : "No data available"}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-row flex-wrap gap-2">
        <Combobox
          className="w-full md:w-[230px]"
          options={Object.entries(possibleChartTopicsConfig).map(
            ([key, value]) => ({
              value: key,
              label: value.label,
            }),
          )}
          value={chartTopic}
          onChange={(value) => {
            handleChartTopicChange(
              value,
              Object.keys(possibleChartTopicsConfig[value].fields)[0],
            );
          }}
        />
        <Combobox
          className="w-full md:w-[230px]"
          options={fieldOptions}
          value={chartTopicField}
          onChange={(value) => handleChartTopicChange(chartTopic, value)}
        />
      </CardFooter>
    </Card>
  );
}
