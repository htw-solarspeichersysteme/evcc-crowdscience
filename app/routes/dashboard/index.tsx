import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { sum } from "simple-statistics";

import { DashboardGraph } from "~/components/dashboard-graph";
import { ChargingHourHistogram } from "~/components/dashboard-tiles/charging-hour-histogram";
import { StartSocHistogram } from "~/components/dashboard-tiles/start-soc-histogram";
import { InstancesFilter } from "~/components/instances-filter";
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
    const instanceIds = filterInstances(instances, deps.search.iFltr).map(
      (instance) => instance.id,
    );
    const promises = [
      context.queryClient.ensureQueryData(
        loadingSessionApi.getExtractedSessions.getOptions({
          data: { instanceIds },
        }),
      ),
      context.queryClient.ensureQueryData(
        instanceApi.getChargingHourHistogram.getOptions({
          data: { instanceIds },
        }),
      ),
      context.queryClient.ensureQueryData(
        batteryApi.getBatteryData.getOptions(),
      ),
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
    <div className="grid gap-2 md:gap-4 md:grid-cols-4 lg:grid-cols-8 xl:grid-cols-12">
      <InstancesFilter className="w-full mx-auto col-span-full md:col-span-4 lg:col-span-full xl:col-span-12" />
      <DashboardGraph
        title="Active Instances"
        className="md:col-span-2 xl:col-span-3"
      >
        <div className="text-2xl font-bold">{filteredInstances.length}</div>
      </DashboardGraph>
      <DashboardGraph title="Sessions" className="md:col-span-2 xl:col-span-3">
        <div className="text-2xl font-bold">{loadingSessions?.length}</div>
      </DashboardGraph>
      <DashboardGraph
        title="Total Battery Capacity"
        className="md:col-span-2 xl:col-span-3"
      >
        <div className="text-2xl font-bold">
          {formatUnit(totalBatteryData.capacity, "kWh", 1)}
        </div>
      </DashboardGraph>
      <DashboardGraph
        title="Total connected Batteries"
        className="md:col-span-2 xl:col-span-3"
      >
        <div className="text-2xl font-bold">
          {totalBatteryData.connectedBatteries}
        </div>
        <p className="inline text-xs text-muted-foreground">
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
        className="md:col-span-4 lg:col-span-4 xl:col-span-6"
        instanceIds={filteredInstances.map((instance) => instance.id)}
        heightConfig={{ min: 200, max: 400 }}
      />
      <StartSocHistogram
        title="Start SOC Distribution (last 30 days)"
        className="md:col-span-4 lg:col-span-4 xl:col-span-6"
        instanceIds={
          filter ? filteredInstances.map((instance) => instance.id) : undefined
        }
        heightConfig={{ min: 200, max: 400 }}
      />
    </div>
  );
}
