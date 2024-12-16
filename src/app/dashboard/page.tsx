import { ActiveInstances } from "~/components/dashboard/ActiveInstances";
import { BatteryCapacityOverview } from "~/components/dashboard/BatteryCapacity";
import { BatteryEnergyOverview } from "~/components/dashboard/BatteryEnergy";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="md:grids-col-2 grid md:gap-4 lg:grid-cols-10 xl:grid-cols-11 xl:gap-4">
      <BatteryCapacityOverview className="col-span-3" />
      <BatteryEnergyOverview className="col-span-3" />
      <ActiveInstances className="col-span-3" />
    </div>
  );
}
