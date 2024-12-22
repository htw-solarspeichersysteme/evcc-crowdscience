import { useSuspenseQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DashboardGraph } from "~/components/dashboard-graph";
import { renderUnit } from "~/lib/utils";
import { batteryQueries } from "~/serverHandlers/battery";
import { instancesQueries } from "~/serverHandlers/instances";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
  staticData: {
    routeTitle: "Dashboard",
  },
  wrapInSuspense: true,
});

function RouteComponent() {
  const [{ data: batteryData }, { data: instancesData }] = useSuspenseQueries({
    queries: [
      batteryQueries.getBatteryData({}),
      instancesQueries.getActiveInstances(),
    ],
  });

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

  console.log(totalBatteryData);

  return (
    <div className="md:grids-col-2 grid md:gap-4 lg:grid-cols-10 xl:grid-cols-11 xl:gap-4 gap-2">
      <DashboardGraph title="Active Instances" className="col-span-3">
        <div className="text-2xl font-bold">{instancesData.length}</div>
      </DashboardGraph>
      <DashboardGraph title="Total Battery Capacity" className="col-span-3">
        <div className="text-2xl font-bold">
          {renderUnit(totalBatteryData.capacity, "kWh", 1)}
        </div>
      </DashboardGraph>
      <DashboardGraph title="Total Battery Energy" className="col-span-3">
        <div className="text-2xl font-bold">
          {renderUnit(totalBatteryData.energy, "kWh", 1)}
        </div>
        <p className="text-xs text-muted-foreground inline">
          {renderUnit(
            (totalBatteryData.energy / totalBatteryData.capacity) * 100,
            "%",
            1,
          )}
          &nbsp;of capacity
        </p>
      </DashboardGraph>

      <DashboardGraph title="Total connected Batteries" className="col-span-3">
        <div className="text-2xl font-bold">
          {totalBatteryData.connectedBatteries}
        </div>
        <p className="text-xs text-muted-foreground inline">
          ~
          {renderUnit(
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
