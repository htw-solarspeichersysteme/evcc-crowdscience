import { renderUnit } from "~/lib/utils";
import { api } from "~/trpc/server";
import { DashboardGraph } from "./DashboardGraph";

export async function BatteryEnergyOverview({
  className,
}: {
  className?: string;
}) {
  const data = await api.battery.getTotalBatteryData();

  return (
    <>
      <DashboardGraph title="Total Battery Energy" className={className}>
        <div className="text-2xl font-bold">
          {renderUnit(data?.energy, "kWh", 1)}
        </div>
        <p className="text-xs text-muted-foreground inline">
          {renderUnit((data.energy / data.capacity) * 100, "%", 1)} of capacity
        </p>
      </DashboardGraph>
    </>
  );
}
