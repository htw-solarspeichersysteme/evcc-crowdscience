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
  data: { value: number | string; time: Date }[];
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
        throttleDelay={100}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: Date) => formatDate(value, "MMM dd HH:mm")}
          {...config.xAxis}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
          {...config.tooltip}
        />
        {config.yAxis ? (
          <YAxis
            dataKey="value"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value: number | string) => value.toString()}
            {...config.yAxis}
          />
        ) : null}
        {/* @ts-expect-error i think this is a type error in recharts */}
        <Area
          dataKey="value"
          type="natural"
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
