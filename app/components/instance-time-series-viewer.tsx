import { useDeferredValue } from "react";

import type { possibleInstanceTimeSeriesMetrics } from "~/constants";
import { Route } from "~/routes/dashboard/instances/$instanceId";
import { instanceApi } from "~/serverHandlers/instance";
import { AreaChartComponent } from "./charts/area-chart";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Combobox, type ComboboxOption } from "./ui/combo-box";

export const comboBoxOptions = [
  { value: "batterySoc", label: "Battery SOC" },
  { value: "pvPower", label: "PV Power" },
  { value: "gridPower", label: "Grid Power" },
] as const satisfies ComboboxOption<
  (typeof possibleInstanceTimeSeriesMetrics)[number]
>[];

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
    select: (data) => data.map((d) => ({ ...d, time: new Date(d.time) })),
  });

  const deferredData = useDeferredValue(data);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Instance Time Series Viewer</CardTitle>
      </CardHeader>
      <CardContent>
        {!isLoading && deferredData?.length === 0 ? (
          <div>No data available</div>
        ) : (
          <AreaChartComponent data={deferredData ?? []} />
        )}
      </CardContent>
      <CardFooter>
        <Combobox
          options={comboBoxOptions}
          value={timeSeriesMetric}
          onChange={(value) => {
            void navigate({
              search: { timeSeriesMetric: value },
            });
          }}
        />
      </CardFooter>
    </Card>
  );
}
