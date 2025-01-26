import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { subDays } from "date-fns";
import { sum } from "simple-statistics";

import { DashboardGraph } from "~/components/dashboard-graph";
import { ChargingHourHistogram } from "~/components/dashboard-tiles/charging-hour-histogram";
import { StartSocHistogram } from "~/components/dashboard-tiles/start-soc-histogram";
import { InstancesFilter } from "~/components/instances-filter";
import { Separator } from "~/components/ui/separator";
import {
  filterInstances,
  useInstancesFilter,
} from "~/hooks/use-instances-filter";
import { formatUnit } from "~/lib/utils";
import { batteryApi } from "~/serverHandlers/battery";
import { instanceApi } from "~/serverHandlers/instance/serverFns";
import { loadingSessionApi } from "~/serverHandlers/loadingSession/serverFns";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context, deps }) => {
    const instances = await context.queryClient.fetchQuery(
      instanceApi.getActiveInstances.getOptions(),
    );
    const filteredInstances = filterInstances(instances, deps.search.iFltr);
    const promises = [
      loadingSessionApi.getExtractedSessions.getOptions({
        data: { instanceIds: filteredInstances.map((instance) => instance.id) },
      }),
      batteryApi.getBatteryData.getOptions(),
    ];
    await Promise.allSettled(promises);
  },
  staticData: {
    routeTitle: "Dashboard",
  },
});

function RouteComponent() {
  const { filteredInstances, filter } = useInstancesFilter();

  const { data: batteryData } = batteryApi.getBatteryData.useSuspenseQuery();
  const { data: loadingSessions } =
    loadingSessionApi.getExtractedSessions.useSuspenseQuery({
      variables: {
        data: {
          instanceIds: filteredInstances.map((instance) => instance.id),
        },
      },
    });

  const totalBatteryData = useMemo(() => {
    const count = Object.keys(batteryData).length;
    const capacity = sum(
      Object.values(batteryData).map((components) =>
        sum(Object.values(components).map((c) => c.capacity ?? 0)),
      ),
    );
    return {
      capacity,
      connectedBatteries: count,
    };
  }, [batteryData, filteredInstances]);

  return (
    <div className="md:grid-cols-4 grid md:gap-4 xl:grid-cols-12 xl:gap-4 gap-2">
      <InstancesFilter className="col-span-4 md:col-span-12 mx-auto w-full" />
      <Separator className="col-span-4 md:col-span-12" />
      <DashboardGraph
        title="Active Instances"
        className="col-span-2 md:col-span-4 border-primary"
      >
        <div className="text-2xl font-bold">{filteredInstances.length}</div>
      </DashboardGraph>
      <DashboardGraph
        title="Sessions"
        className="col-span-2 md:col-span-4 border-primary"
      >
        <div className="text-2xl font-bold">{loadingSessions?.length}</div>
      </DashboardGraph>
      <DashboardGraph
        title="Total Battery Capacity"
        className="col-span-2 md:col-span-4 border-primary"
      >
        <div className="text-2xl font-bold">
          {formatUnit(totalBatteryData.capacity, "kWh", 1)}
        </div>
      </DashboardGraph>
      <DashboardGraph
        title="Total connected Batteries"
        className="col-span-2 md:col-span-4 border-primary"
      >
        <div className="text-2xl font-bold">
          {totalBatteryData.connectedBatteries}
        </div>
        <p className="text-xs text-muted-foreground inline">
          ~
          {formatUnit(
            totalBatteryData.capacity / totalBatteryData.connectedBatteries,
            "kWh",
            1,
          )}
          &nbsp;per battery
        </p>
      </DashboardGraph>
      <ChargingHourHistogram
        className="col-span-4 md:col-span-8 border-primary row-span-2"
        instanceIds={
          filter ? filteredInstances.map((instance) => instance.id) : []
        }
        timeRange={{
          start: +subDays(new Date(), 30).setHours(0, 0, 0, 0),
          end: +new Date().setHours(23, 59, 59, 999),
        }}
      />
      <StartSocHistogram
        title="Start SOC Distribution (last 30 days)"
        className="col-span-4 border-primary"
        instanceIds={
          filter ? filteredInstances.map((instance) => instance.id) : undefined
        }
      />
    </div>
  );
}
