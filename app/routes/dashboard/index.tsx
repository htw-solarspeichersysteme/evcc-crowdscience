import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import {
  DashboardGraph,
  ExpandableDashboardGraph,
} from "~/components/dashboard-graph";
import { renderUnit } from "~/lib/utils";
import { batteryApi } from "~/serverHandlers/battery";
import { instanceApi } from "~/serverHandlers/instance";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
  validateSearch: zodValidator(
    z.object({ expandedKey: z.string().optional() }),
  ),
  loader: async ({ context }) => {
    const promises = [
      context.queryClient.ensureQueryData(
        instanceApi.getActiveInstances.getOptions({
          data: { range: "-1d" },
        }),
      ),
      context.queryClient.ensureQueryData(
        batteryApi.getBatteryData.getOptions({
          data: {},
        }),
      ),
    ];
    await Promise.allSettled(promises);
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
    instanceApi.getActiveInstances.useSuspenseQuery({
      variables: { data: { range: "-1d" } },
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

  return (
    <div className="md:grid-cols-4 grid md:gap-4 xl:grid-cols-12 xl:gap-4 gap-2">
      <DashboardGraph title="Active Instances" className="col-span-2">
        <div className="text-2xl font-bold">{instancesData.length}</div>
      </DashboardGraph>
      <DashboardGraph title="Total Battery Capacity" className="col-span-2">
        <div className="text-2xl font-bold">
          {renderUnit(totalBatteryData.capacity, "kWh", 1)}
        </div>
      </DashboardGraph>
      <ExpandableDashboardGraph
        title="Total Battery Energy"
        className="col-span-2"
        expandKey="battery"
        mainContent={
          <>
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
          </>
        }
        expandContent={<div>expanded content, here should be more details</div>}
      />

      <DashboardGraph title="Total connected Batteries" className="col-span-2">
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
