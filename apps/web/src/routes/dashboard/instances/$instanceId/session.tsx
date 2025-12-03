import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import type { EChartsOption } from "echarts";
import type * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import z from "zod";

import { LoadingSpinnerCard } from "~/components/loading-spinner-card";
import { SessionInfo } from "~/components/session-info";
import { TimeSeriesSettingsPicker } from "~/components/time-series-settings-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getChartColor, sharedChartOptions } from "~/constants";
import { useTimeSeriesSettings } from "~/hooks/use-timeseries-settings";
import { orpc } from "~/orpc/client";

export const Route = createFileRoute(
  "/dashboard/instances/$instanceId/session",
)({
  validateSearch: z.object({
    sessionRangeHash: z.string(),
  }),
  loaderDeps: ({ search }) => ({ search }),
  component: RouteComponent,
  beforeLoad: async ({ search }) => {
    const session = await orpc.loadingSessions.getSessionByHash.call({
      sessionRangeHash: search.sessionRangeHash,
    });

    if (!session) {
      throw new Error("Session not found");
    }

    return {
      session,
      routeTitle: (() => {
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
        const durationMin = Math.round(
          (end.getTime() - start.getTime()) / 60000,
        );
        const durationStr =
          durationMin >= 60
            ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
            : `${durationMin}m`;
        return `${format(start, "MMM d, HH:mm")} · ${durationStr}`;
      })(),
    };
  },
});

const excludedFields = [
  "planProjectedEnd",
  "planProjectedStart",
  "effectivePlanTime",
];

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const { timeRange } = useTimeSeriesSettings();

  // Fetch historical sessions for comparison
  const { data: historicalSessions } = useQuery(
    orpc.loadingSessions.getExtractedSessions.queryOptions({
      input: {
        instanceIds: [session.instanceId],
      },
    }),
  );

  // Compute historical averages
  const historicalAverage = historicalSessions
    ? (() => {
        const sessionsWithPrice = historicalSessions.filter(
          (s) =>
            s.price != null && s.chargedEnergy != null && s.chargedEnergy > 0,
        );

        const avgPrice =
          sessionsWithPrice.length > 0
            ? sessionsWithPrice.reduce((sum, s) => {
                const energyKwh = (s.chargedEnergy ?? 0) / 1000;
                return sum + (s.price ?? 0) / energyKwh;
              }, 0) / sessionsWithPrice.length
            : undefined;

        // Note: sessionCo2PerKWh is not in the database schema yet,
        // so we skip CO2 comparison for now
        return { avgPrice, avgCo2PerKwh: undefined };
      })()
    : undefined;

  const { data, isLoading } = useQuery(
    orpc.timeSeries.getData.queryOptions({
      input: {
        chartTopic: "loadpoints",
        instanceId: session.instanceId,
        componentId: session.componentId,
        timeRange: {
          start: session.startTime.getTime(),
          end: session.endTime.getTime(),
          windowMinutes: timeRange.windowMinutes,
        },
      },
      select: (data) =>
        data.filter((table) => !excludedFields.includes(table.field)),
    }),
  );

  const option: EChartsOption = {
    ...sharedChartOptions,
    tooltip: {
      trigger: "item",
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
        startValue: session.startTime.getTime(),
        endValue: session.endTime.getTime(),
      },
    ],
    xAxis: {
      type: "time",
      min: session.startTime.getTime(),
      max: session.endTime.getTime(),
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
    series: (data ?? []).map((table, index) => {
      const color = getChartColor(index);

      return {
        name: table.field,
        type: "scatter",
        // showSymbol: false,
        // connectNulls: false,
        // lineStyle: {
        //   width: 2,
        //   color: color.stroke,
        // },
        itemStyle: {
          color: color.stroke,
        },
        emphasis: {
          focus: "series",
          // lineStyle: {
          //   color: color.stroke,
          // },
          // areaStyle: {
          //   opacity: 0.3,
          //   color: color.fill,
          // },
        },
        // blur: {
        //   areaStyle: {
        //     opacity: 0.1,
        //   },
        //   lineStyle: {
        //     opacity: 0.3,
        //   },
        // },
        data: table.data,
        // areaStyle: {
        //   opacity: 0.3,
        //   color: color.fill,
        // },
      } satisfies echarts.SeriesOption;
    }),
  };

  return (
    <div className="flex flex-col gap-6">
      <SessionInfo session={session} historicalAverage={historicalAverage} />
      <Card>
        <CardHeader>
          <CardTitle>Session Timeline</CardTitle>
          <CardDescription>
            {format(session.startTime, "PPpp")} -{" "}
            {format(session.endTime, "PPpp")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TimeSeriesSettingsPicker />
          <div className="relative aspect-video max-h-[1000px] min-h-[300px]">
            {isLoading && <LoadingSpinnerCard message="Loading chart data" />}
            {data?.length && data.length > 0 ? (
              <ReactECharts
                option={option}
                autoResize={true}
                className="h-full w-full"
                style={{ height: "100%", width: "100%" }}
                notMerge={true}
                lazyUpdate={true}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
