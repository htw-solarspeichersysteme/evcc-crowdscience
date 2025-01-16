import { formatDate } from "date-fns";
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis } from "recharts";

import type { WindowedTimeSeriesData } from "~/lib/globalSchemas";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";

export function StateTimelineChart<TData extends string | number | boolean>({
  data,
  className,
  tooltipFormatter,
}: {
  data: WindowedTimeSeriesData<TData>[];
  className?: string;
  tooltipFormatter?: (
    xValue: number,
    name: string,
    item: unknown,
    index: number,
    payload: WindowedTimeSeriesData<TData>,
  ) => string[];
}) {
  const domain = [
    Math.min(...data.map((d) => d.startTimeStamp)),
    Math.max(...data.map((d) => d.endTimeStamp)),
  ];

  return (
    <ChartContainer config={{}} className={className}>
      <BarChart
        accessibilityLayer
        data={data}
        layout="horizontal"
        syncId="time-series-chart"
        throttleDelay={200}
      >
        <CartesianGrid vertical={false} />

        <XAxis
          dataKey={"startTimeStamp"}
          type="number"
          tickLine={false}
          axisLine={false}
          domain={domain}
          tickFormatter={(d: number) => formatDate(new Date(d), "yyyy-MM-dd")}
          tickCount={10}
          height={15}
        />

        <Bar dataKey="startTimeStamp" color={"asda"}>
          {data.map((d) => (
            <Cell
              key={[d.startTimeStamp, d.endTimeStamp].join("-")}
              fill={d.value ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"}
              width={d.endTimeStamp - d.startTimeStamp}
            />
          ))}
        </Bar>
        <ChartTooltip
          cursor={true}
          // @ts-expect-error our shape is different (for some reason)
          formatter={tooltipFormatter ? tooltipFormatter : undefined}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Tooltip />
      </BarChart>
    </ChartContainer>
  );
}
