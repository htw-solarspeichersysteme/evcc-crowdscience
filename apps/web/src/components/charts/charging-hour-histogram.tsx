import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { EChartsOption } from "echarts";
import type * as echarts from "echarts";
import ReactECharts from "echarts-for-react";

import { getChartColor, sharedChartOptions } from "~/constants";
import { orpc } from "~/orpc/client";
import { DashboardGraph } from "../dashboard-graph";

export function ChargingHourHistogram({
  instanceIds,
  className,
  linkToInstanceOnClick = true,
  title,
  heightConfig,
}: {
  instanceIds: string[];
  className?: string;
  linkToInstanceOnClick?: boolean;
  title?: string;
  heightConfig?: {
    min: number;
    max: number;
  };
}) {
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(
    orpc.chargingStats.getChargingHourHistogram.queryOptions({
      input: { instanceIds },
    }),
  );

  const option: EChartsOption = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const instanceEntries = Object.entries(data ?? {});

    // Calculate stacked values for each hour
    const stackedData = instanceEntries.map(([instanceId], index) => {
      const values = data?.[instanceId] ?? [];
      return {
        name: instanceId,
        type: "bar" as const,
        stack: "charging",
        data: hours.map((hour) => values[hour] ?? 0),
        itemStyle: {
          color: getChartColor(index + 1).fill,
          borderColor: getChartColor(index + 1).stroke,
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: {
            color: getChartColor(index + 1).stroke,
          },
        },
      } satisfies echarts.SeriesOption;
    });

    return {
      ...sharedChartOptions,
      animation: false,
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
        formatter: (params) => {
          if (!Array.isArray(params)) return "";
          const hour = params[0].dataIndex;
          const timeFrame = `${hour}:00 - ${hour + 1}:00`;
          const parts: string[] = [timeFrame];
          params.forEach((param) => {
            const value = param.value as number;
            if (value > 0) {
              parts.push(
                `${value} charge event${value === 1 ? "" : "s"} | ${param.seriesName}`,
              );
            }
          });
          return parts.join("<br/>");
        },
      },
      grid: {
        left: 50,
        right: 10,
        top: 20,
        bottom: 50,
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: hours,
        name: "Hour of the day",
        nameLocation: "center",
        nameGap: 30,
        nameTextStyle: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 12,
        },
        axisLine: { lineStyle: { color: "hsl(var(--border))" } },
        axisLabel: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 10,
        },
        axisTick: { lineStyle: { color: "hsl(var(--border))" } },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "hsl(var(--border))" } },
        axisLabel: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 10,
        },
        splitLine: {
          lineStyle: { color: "hsl(var(--border))", opacity: 0.3 },
        },
      },
      series: stackedData,
    } satisfies EChartsOption;
  }, [data]);

  const handleClick = (params: echarts.ECElementEvent) => {
    if (!linkToInstanceOnClick || params.seriesType !== "bar") return;
    const instanceId = params.seriesName;
    if (instanceId && typeof instanceId === "string") {
      void navigate({
        to: "/dashboard/instances/$instanceId",
        params: {
          instanceId,
        },
      });
    }
  };

  return (
    <DashboardGraph
      title={title ?? "Charging Time Distribution (last 30 days)"}
      className={className}
    >
      <ReactECharts
        option={option}
        onChartReady={(instance) => {
          instance.on("click", handleClick);
        }}
        style={{
          width: "100%",
          height: "100%",
          minHeight: heightConfig?.min ? `${heightConfig.min}px` : undefined,
        }}
        opts={{
          renderer: "canvas",
        }}
      />
    </DashboardGraph>
  );
}
