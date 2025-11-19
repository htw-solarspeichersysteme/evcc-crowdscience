import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClientOnly } from "@tanstack/react-router";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";

import { getChartColor } from "~/constants";
import { useTimeSeriesSettings } from "~/hooks/use-timeseries-settings";
import { possibleChartTopicsConfig } from "~/lib/time-series-config";
import { cn, formatUnit } from "~/lib/utils";
import { orpc } from "~/orpc/client";
import { TimeSeriesSettingsPicker } from "../time-series-settings-picker";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Combobox } from "../ui/combo-box";

export function InstanceTimeSeriesEcharts({
  instanceId,
  chartTopic,
  chartTopicField,
  handleChartTopicChange,
  className,
}: {
  instanceId: string;
  chartTopic: string;
  chartTopicField?: string;
  handleChartTopicChange: (
    chartTopic: string,
    chartTopicField?: string,
  ) => void;
  className?: string;
}) {
  const { timeRange } = useTimeSeriesSettings();

  const { data, isFetching, isLoading } = useQuery(
    orpc.timeSeries.getData.queryOptions({
      input: { chartTopic, instanceId, timeRange },
    }),
  );

  const fieldOptions = useMemo(() => {
    const options: Record<
      string,
      { value: string; label: string; unit?: string }
    > = {};

    for (const [key, value] of Object.entries(
      possibleChartTopicsConfig?.[chartTopic]?.fields,
    )) {
      if (!data?.some((table) => table.field === key)) continue;
      options[key] ??= {
        value: key,
        label: value.label,
        unit: value?.unit,
      };
    }

    for (const table of data ?? []) {
      options[table.field] ??= {
        value: table.field,
        label: table.field,
      };
    }

    return Object.values(options);
  }, [chartTopic, data]);

  const fieldOption = fieldOptions.find(
    (option) => option.value === chartTopicField,
  );

  const filteredData = useMemo(() => {
    if (!data || !chartTopicField) return [];
    return data.filter((table) => table.field === chartTopicField);
  }, [data, chartTopicField]);

  const option: EChartsOption = {
    animation: false,
    grid: {
      left: 10,
      right: 10,
      top: 40,
      bottom: 70,
      containLabel: true,
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
    },
    dataZoom: [
      {
        type: "inside",
        xAxisIndex: 0,
        filterMode: "none",
        startValue: timeRange.start,
        endValue: timeRange.end,
        minValueSpan: 3600 * 1000,
        zoomOnMouseWheel: true,
      },
      {
        type: "slider",
        xAxisIndex: 0,
        filterMode: "none",
        height: 20,
        bottom: 10,
        borderColor: "#ccc",
        startValue: timeRange.start,
        endValue: timeRange.end,
        minValueSpan: 3600 * 1000, // 1 hour minimum zoom
      },
    ],
    toolbox: {
      feature: {
        restore: {},
        saveAsImage: {},
      },
      top: -10,
    },
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

    series: filteredData.map((table, index) => {
      const color = getChartColor(index);
      const nameParts: string[] = [];
      if (table.componentId) nameParts.push(`Component: ${table.componentId}`);
      if (table.vehicleId) nameParts.push(`Vehicle: ${table.vehicleId}`);
      const name =
        nameParts.length > 0
          ? nameParts.join(" ")
          : (fieldOption?.label ?? table.field);

      return {
        name,
        type: "line" as const,
        showSymbol: false,
        smooth: true,
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
      };
    }),
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-col gap-2">
        <TimeSeriesSettingsPicker className="col-span-3 lg:col-span-full" />
      </CardHeader>
      <CardContent className="relative aspect-video max-h-[1000px] min-h-[300px] grow">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 shadow-lg">
              <div className="relative h-8 w-8">
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-muted" />
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Loading chart data
              </span>
            </div>
          </div>
        )}
        {filteredData.length > 0 ? (
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
        <ClientOnly>
          <Combobox
            className="w-full md:w-[230px]"
            options={fieldOptions}
            value={chartTopicField}
            onChange={(value) => handleChartTopicChange(chartTopic, value)}
          />
        </ClientOnly>
      </CardFooter>
    </Card>
  );
}
