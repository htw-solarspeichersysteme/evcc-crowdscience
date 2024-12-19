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
      batteryQueries.getTotalBatteryData(),
      instancesQueries.getActiveInstances(),
    ],
  });

  return (
    <div className="md:grids-col-2 grid md:gap-4 lg:grid-cols-10 xl:grid-cols-11 xl:gap-4">
      <DashboardGraph title="Total Battery Capacity" className="col-span-3">
        <div className="text-2xl font-bold">
          {renderUnit(batteryData.capacity, "kWh", 1)}
        </div>
      </DashboardGraph>
      <DashboardGraph title="Total Battery Energy" className="col-span-3">
        <div className="text-2xl font-bold">
          {renderUnit(batteryData.energy, "kWh", 1)}
        </div>
        <p className="text-xs text-muted-foreground inline">
          {renderUnit(
            (batteryData.energy / batteryData.capacity) * 100,
            "%",
            1,
          )}
          of capacity
        </p>
      </DashboardGraph>
      <DashboardGraph title="Active Instances" className="col-span-3">
        <div className="text-2xl font-bold">{instancesData.length}</div>
      </DashboardGraph>
    </div>
  );
}
