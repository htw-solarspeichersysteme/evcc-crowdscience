import { createFileRoute } from "@tanstack/react-router";
import { subDays } from "date-fns";

import {
  DashboardGraph,
  ExpandableDashboardGraph,
} from "~/components/dashboard-graph";
import { ChargingHourHistogram } from "~/components/dashboard-tiles/charging-hour-histogram";
import { InstancesFilter } from "~/components/instances-filter";
import { Separator } from "~/components/ui/separator";
import { useInstancesFilter } from "~/hooks/use-instances-filter";
import { formatUnit } from "~/lib/utils";
import { batteryApi } from "~/serverHandlers/battery";
import { instanceApi } from "~/serverHandlers/instance";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context }) => {
    void context.queryClient.ensureQueryData(
      instanceApi.getActiveInstances.getOptions(),
    );
    await context.queryClient.ensureQueryData(
      batteryApi.getBatteryData.getOptions(),
    );
  },
  staticData: {
    routeTitle: "Dashboard",
  },
});

function RouteComponent() {
  const { data: batteryData } = batteryApi.getBatteryData.useSuspenseQuery();

  const { filteredInstances, filter } = useInstancesFilter();

  const totalBatteryData = Object.entries(batteryData).reduce(
    (acc, [instanceId, components]) => {
      if (!filteredInstances.some((instance) => instance.id === instanceId))
        return acc;

      Object.values(components).forEach((component) => {
        acc.capacity += component.capacity ?? 0;
        acc.energy += component.energy ?? 0;
        acc.connectedBatteries += 1;
      });

      return acc;
    },
    {
      capacity: 0,
      energy: 0,
      connectedBatteries: 0,
    },
  );

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
        title="Total Battery Capacity"
        className="col-span-2 md:col-span-4 border-primary"
      >
        <div className="text-2xl font-bold">
          {formatUnit(totalBatteryData.capacity, "kWh", 1)}
        </div>
      </DashboardGraph>
      <ExpandableDashboardGraph
        title="Total Battery Energy"
        className="col-span-2 md:col-span-4 border-primary"
        expandKey="battery"
        mainContent={
          <>
            <div className="text-2xl font-bold">
              {formatUnit(totalBatteryData.energy, "kWh", 1)}
            </div>
            <p className="text-xs text-muted-foreground inline">
              {formatUnit(
                (totalBatteryData.energy / totalBatteryData.capacity) * 100,
                "%",
                1,
              )}
              &nbsp;of capacity
            </p>
          </>
        }
        expandContent={<div>expanded content, here should be more details</div>}
      ></ExpandableDashboardGraph>

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
        title="Charge Event Distribution (last 30 days)"
        className="col-span-4 md:col-span-8 border-primary"
        instanceIds={
          filter ? filteredInstances.map((instance) => instance.id) : []
        }
        timeRange={{
          start: +subDays(new Date(), 30).setHours(0, 0, 0, 0),
          end: +new Date().setHours(23, 59, 59, 999),
        }}
      />
    </div>
  );
}
