import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
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
import { orpc } from "~/orpc/client";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
  loaderDeps: ({ search }) => ({ search }),
  beforeLoad: () => ({ routeTitle: false }),
  loader: async ({ context, deps }) => {
    const instances = await context.queryClient.fetchQuery(
      orpc.instances.getOverview.queryOptions({ input: {} }),
    );
    const instanceIds = filterInstances(instances, deps.search.iFltr).map(
      (instance) => instance.id,
    );
    const promises = [
      context.queryClient.ensureQueryData(
        orpc.loadingSessions.getExtractedSessions.queryOptions({
          input: { instanceIds },
        }),
      ),
      context.queryClient.ensureQueryData(
        orpc.chargingStats.getChargingHourHistogram.queryOptions({
          input: { instanceIds },
        }),
      ),
      context.queryClient.ensureQueryData(
        orpc.batteries.getData.queryOptions(),
      ),
    ];
    await Promise.allSettled(promises);
  },
});

function RouteComponent() {
  const { filteredInstances } = useInstancesFilter();

  const { data: batteryData } = useSuspenseQuery(
    orpc.batteries.getData.queryOptions(),
  );
  const { data: loadingSessions } = useSuspenseQuery(
    orpc.loadingSessions.getExtractedSessions.queryOptions({
      input: { instanceIds: filteredInstances.map((instance) => instance.id) },
    }),
  );

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
    <div className="grid gap-2 md:grid-cols-4 md:gap-4 lg:grid-cols-8 xl:grid-cols-12">
      <InstancesFilter className="col-span-full mx-auto w-full md:col-span-4 lg:col-span-full xl:col-span-12" />
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
        instanceIds={filteredInstances.map((instance) => instance.id)}
        heightConfig={{ min: 200, max: 400 }}
      />
    </div>
  );
}
