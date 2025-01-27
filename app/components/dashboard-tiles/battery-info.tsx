import { sum } from "simple-statistics";

import { type BatteryMetaData } from "~/serverHandlers/battery";
import { MetadataGraph } from "../dashboard-graph";

export function calculateBatteryInfo(batteryMetaData: BatteryMetaData) {
  const count = Object.keys(batteryMetaData).length;
  const totalCapacity = sum(
    Object.entries(batteryMetaData).map(
      ([_, value]) => +(value?.capacity?.value ?? 0),
    ),
  );
  const avgCapacity = totalCapacity / count;
  return { totalCapacity, avgCapacity, count };
}

export function BatteryInfo({
  batteryMetaData,
  className,
}: {
  batteryMetaData: BatteryMetaData;
  className?: string;
}) {
  const { totalCapacity, avgCapacity } = calculateBatteryInfo(batteryMetaData);

  return (
    <MetadataGraph
      title="Battery Info"
      expandKey="battery-metadata"
      className={className}
      mainContent={
        <div className="flex flex-col gap-2">
          <span>
            {totalCapacity} kWh in {Object.keys(batteryMetaData).length} Batter
            {Object.keys(batteryMetaData).length > 1 ? "ies" : "y"}
          </span>
          <span className="text-sm text-muted-foreground">
            ø {avgCapacity} kWh
          </span>
        </div>
      }
      metaData={batteryMetaData}
    />
  );
}
