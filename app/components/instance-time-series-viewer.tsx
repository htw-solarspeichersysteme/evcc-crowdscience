import { useNavigate } from "@tanstack/react-router";
import uPlot, { type Axis, type Scale, type Scales, type Series } from "uplot";
import { z } from "zod";

import {
  getChartColor,
  type possibleInstanceTimeSeriesMetrics,
} from "~/constants";
import { formatUnit } from "~/lib/utils";
import { instanceApi } from "~/serverHandlers/instance";
import { ResponsiveUplot } from "./u-plot/responsive-uplot";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Combobox } from "./ui/combo-box";

const timeSeriesChartConfig = {
  percent: {
    scale: {
      range: [0, 100],
    },
    axis: { show: true },
    format: (value) => formatUnit(value, "%"),
  },
  fraction: {
    scale: {
      range: [0, 1],
    },
    axis: { show: true },
    format: (value) => formatUnit(value ? value * 100 : null, "%"),
  },
  watt: {
    scale: { auto: true },
    axis: { show: true },
    format: (value) => formatUnit(value, "W"),
  },
  y: {
    scale: { auto: true },
    axis: { show: true },
    format: (value) => formatUnit(value, ""),
  },
} satisfies Record<
  string,
  { scale: Scale; axis: Axis; format: (value: number | null) => string }
>;

type MetricConfig = Record<
  (typeof possibleInstanceTimeSeriesMetrics)[number],
  {
    title: string;
    series: Series[];
    scale?: keyof typeof timeSeriesChartConfig;
  }
>;

const metricConfigs: MetricConfig = {
  batterySoc: {
    title: "Battery SOC",
    series: [{ ...getChartColor(0) }],
    scale: "percent",
  },
  pvPower: {
    title: "PV Power",
    series: [{ ...getChartColor(1) }],
    scale: "watt",
  },
  gridPower: {
    title: "Grid Power",
    series: [{ ...getChartColor(2) }],
    scale: "watt",
  },
  batteryPower: {
    title: "Battery Power",
    series: [{ ...getChartColor(3) }],
    scale: "watt",
  },
  homePower: {
    title: "Home Power",
    series: [{ ...getChartColor(4) }],
    scale: "watt",
  },
  greenShareHome: {
    title: "Green Share Home",
    series: [{ ...getChartColor(5) }],
    scale: "fraction",
  },
  greenShareLoadpoints: {
    title: "Green Share Loadpoints",
    series: [{ ...getChartColor(6) }],
    scale: "fraction",
  },
} as const satisfies MetricConfig;

const comboBoxOptions = Object.entries(metricConfigs).map(([key, value]) => ({
  value: key,
  label: value.title,
}));

export function InstanceTimeSeriesViewer({
  className,
  instanceId,
  shownMetricKey,
}: {
  className?: string;
  instanceId: string;
  shownMetricKey: (typeof possibleInstanceTimeSeriesMetrics)[number];
}) {
  const navigate = useNavigate();

  const { data } = instanceApi.getTimeSeriesData.useSuspenseQuery({
    variables: { data: { metric: shownMetricKey, instanceId } },
    select: (data) =>
      data.reduce(
        (acc, d) => {
          acc[0].push(d.timeStamp / 1000);
          acc[1].push(d.value ? z.coerce.number().parse(d.value) : null);
          return acc;
        },
        [[], []] as [number[], (number | null)[]],
      ),
  });

  const metricConfig = metricConfigs[shownMetricKey];
  const chartConfig = timeSeriesChartConfig[metricConfig.scale ?? "y"];
  const selectedAxis = {
    scale: metricConfig.scale,
    values: (_, ticks) => ticks.map((tick) => chartConfig.format(tick)),
    ...chartConfig.axis,
  } satisfies Axis;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Instance Time Series Viewer</CardTitle>
      </CardHeader>
      <CardContent className="grow">
        {data[1].filter((value) => value !== null).length < 5 ? (
          <div>Not enough data available</div>
        ) : (
          <>
            <ResponsiveUplot
              supposedAspectRatio={16 / 9}
              heightConfig={{ min: 150, max: 600 }}
              data={data}
              options={{
                cursor: {
                  sync: {
                    key: "time",
                  },
                },
                series: [
                  {},
                  ...metricConfig.series.map((series) => ({
                    scale: metricConfig.scale,
                    value: (_: unknown, value: number) =>
                      chartConfig.format(value),
                    label: metricConfig.title,
                    drawStyle: "_spline",
                    paths: uPlot.paths.spline?.({
                      // alignGaps: 0,
                    }),
                    ...series,
                  })),
                ],
                axes: [
                  {
                    scale: "x",
                    show: true,
                  },
                  selectedAxis,
                ],
                scales: Object.entries(timeSeriesChartConfig).reduce(
                  (acc, [key, value]) => {
                    acc[key] = value.scale;
                    return acc;
                  },
                  {} as Scales,
                ),
                padding: [10, 0, 0, 20],
              }}
            />
          </>
        )}
      </CardContent>
      <CardFooter>
        <Combobox
          className="w-[230px]"
          options={comboBoxOptions}
          value={shownMetricKey}
          onChange={(value) => {
            void navigate({
              // @ts-expect-error type gets widened in combobox
              search: (prev) => ({ ...prev, timeSeriesMetric: value }),
            });
          }}
        />
      </CardFooter>
    </Card>
  );
}
