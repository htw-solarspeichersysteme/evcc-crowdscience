import { renderUnit } from "~/lib/utils";
import { api } from "~/trpc/server";
import { DashboardGraph } from "./DashboardGraph";

export async function BatteryCapacityOverview({
  className,
}: {
  className?: string;
}) {
  const data = await api.battery.getTotalBatteryData();

  return (
    <DashboardGraph title="Total Battery Capacity" className={className}>
      <div className="text-2xl font-bold">
        {renderUnit(data.capacity, "kWh", 1)}
      </div>
    </DashboardGraph>
  );
}
