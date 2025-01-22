import { createFileRoute } from "@tanstack/react-router";

import {
  DashboardGraph,
  ExpandableDashboardGraph,
} from "~/components/dashboard-graph";
import { InstancesFilter } from "~/components/instances-filter";
import { Separator } from "~/components/ui/separator";
import { formatUnit } from "~/lib/utils";
import { batteryApi } from "~/serverHandlers/battery";
import { instanceApi } from "~/serverHandlers/instance";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context, deps }) => {
    const activeInstances = await context.queryClient.fetchQuery(
      instanceApi.getActiveInstances.getOptions({
        data: { filter: deps.search.iFltr ?? {} },
      }),
    );
    void context.queryClient.ensureQueryData(
      instanceApi.getActiveInstances.getOptions({
        data: { filter: {} },
      }),
    );
    await context.queryClient.ensureQueryData(
      batteryApi.getBatteryData.getOptions({
        data: {
          instanceIds: activeInstances.map((instance) => instance.id),
        },
      }),
    );
  },
  staticData: {
    routeTitle: "Dashboard",
  },
});

function RouteComponent() {
  const { data: batteryData } = batteryApi.getBatteryData.useSuspenseQuery({
    variables: { data: {} },
  });
  const { data: instancesData } =
    instanceApi.getActiveInstances.useSuspenseQuery();

  const totalBatteryData = Object.values(batteryData).reduce(
    (acc, curr) => {
      Object.values(curr).forEach((component) => {
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
        <div className="text-2xl font-bold">{instancesData?.length ?? 0}</div>
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
    </div>
  );
}
