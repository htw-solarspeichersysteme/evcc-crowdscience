import { useDeferredValue } from "react";
import { formatDate } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  type AreaProps,
  type TooltipProps,
  type XAxisProps,
  type YAxisProps,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import type { TimeSeriesData } from "~/lib/globalSchemas";

export type TimeSeriesChartConfig<
  TValue extends number | string,
  TName extends string,
> = {
  xAxis?: XAxisProps;
  yAxis?: YAxisProps;
  tooltip?: TooltipProps<TValue, TName>;
  area?: Partial<AreaProps>;
};

export function TimeSeriesChart({
  config = {},
  data,
}: {
  config: TimeSeriesChartConfig<number | string, string>;
  data: TimeSeriesData<number | string | null>[];
}) {
  const deferredData = useDeferredValue(data);

  return (
    <ChartContainer config={{}}>
      <AreaChart
        accessibilityLayer
        data={deferredData}
        margin={{
          left: -6,
          right: 12,
        }}
        throttleDelay={200}
        syncId="time-series-chart"
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="timeStamp"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: Date) =>
            formatDate(new Date(value), "MMM dd HH:mm")
          }
          {...config.xAxis}
        />

        <ChartTooltip
          cursor={{
            strokeDasharray: "3 3",
          }}
          animationDuration={0}
          content={<ChartTooltipContent indicator="line" />}
          {...config.tooltip}
        />

        {config.yAxis ? (
          <YAxis
            dataKey="value"
            tickLine={false}
            axisLine={false}
            type="number"
            tickMargin={8}
            tickFormatter={(value: number | string) => value.toString()}
            {...config.yAxis}
          />
        ) : null}
        <Area
          dataKey="value"
          type="monotone"
          fill="hsl(var(--chart-1))"
          fillOpacity={0.4}
          stroke="hsl(var(--chart-1))"
          animationDuration={data.length > 200 ? 0 : 1000}
          {...config.area}
        />
      </AreaChart>
    </ChartContainer>
  );
}
