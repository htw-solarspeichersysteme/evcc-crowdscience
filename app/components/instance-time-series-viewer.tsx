import { useDeferredValue, useMemo } from "react";

import type { possibleInstanceTimeSeriesMetrics } from "~/constants";
import { Route } from "~/routes/dashboard/instances/$instanceId";
import { instanceApi } from "~/serverHandlers/instance";
import {
  TimeSeriesChart,
  type TimeSeriesChartConfig,
} from "./charts/time-series-chart";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Combobox } from "./ui/combo-box";

const timeSeriesMetricMetaData = {
  batterySoc: {
    label: "Battery SOC",
    chartConfig: {
      yAxis: {
        tickFormatter: (value) => `${value} %`,
      },
    },
  },
  pvPower: {
    label: "PV Power",
    chartConfig: {
      yAxis: {
        tickFormatter: (value) => `${value} W`,
      },
    },
  },
  gridPower: {
    label: "Grid Power",
    chartConfig: {
      yAxis: {
        tickFormatter: (value: number | string) => `${value}W`,
      },
    },
  },
  batteryPower: {
    label: "Battery Power",
    chartConfig: {
      yAxis: {
        tickFormatter: (value: number | string) => `${value}W`,
      },
    },
  },
  homePower: {
    label: "Home Power",
    chartConfig: {
      yAxis: {
        tickFormatter: (value: string) => `${value}W`,
      },
    },
  },
  greenShareHome: {
    label: "Green Share Home",
    chartConfig: {
      yAxis: {
        tickFormatter: (value: string) => `${parseFloat(value) * 100}%`,
      },
    },
  },
  greenShareLoadpoints: {
    label: "Green Share Loadpoints",
    chartConfig: {
      yAxis: {
        tickFormatter: (value: string) => `${parseFloat(value) * 100}%`,
      },
    },
  },
} satisfies Record<
  (typeof possibleInstanceTimeSeriesMetrics)[number],
  {
    label: string;
    chartConfig?: TimeSeriesChartConfig<number | string, string>;
  }
>;

const comboBoxOptions = Object.entries(timeSeriesMetricMetaData).map(
  ([value, { label }]) => ({
    value,
    label,
  }),
);

export function InstanceTimeSeriesViewer({
  className,
}: {
  className?: string;
}) {
  const { timeSeriesMetric } = Route.useSearch();
  const { instanceId } = Route.useParams();
  const navigate = Route.useNavigate();

  const { data, isLoading } = instanceApi.getTimeSeriesData.useQuery({
    variables: { data: { metric: timeSeriesMetric, instanceId } },
    select: (data) => {
      return data.map((d) => ({ ...d, time: new Date(d.time) }));
    },
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Instance Time Series Viewer</CardTitle>
      </CardHeader>
      <CardContent>
        {!isLoading && data?.length === 0 ? (
          <div>No data available</div>
        ) : (
          <TimeSeriesChart
            data={data ?? []}
            // @ts-expect-error chart config is optional
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            config={timeSeriesMetricMetaData[timeSeriesMetric]?.chartConfig}
          />
        )}
      </CardContent>
      <CardFooter>
        <Combobox
          className="w-[230px]"
          options={comboBoxOptions}
          value={timeSeriesMetric}
          onChange={(value) => {
            void navigate({
              // @ts-expect-error type gets widened in combobox
              search: { timeSeriesMetric: value },
            });
          }}
        />
      </CardFooter>
    </Card>
  );
}
