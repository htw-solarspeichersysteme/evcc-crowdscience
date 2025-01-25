import { sum } from "simple-statistics";

import { type BatteryMetaData } from "~/serverHandlers/battery";
import { MetadataGraph } from "../dashboard-graph";

export function BatteryInfo({
  batteryMetaData,
}: {
  batteryMetaData: BatteryMetaData;
}) {
  const totalCapacity = sum(
    Object.entries(batteryMetaData).map(
      ([_, value]) => +(value?.capacity?.value ?? 0),
    ),
  );
  const avgCapacity = totalCapacity / Object.keys(batteryMetaData).length;

  return (
    <MetadataGraph
      title="Battery Info"
      expandKey="battery-metadata"
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
      className="col-span-3"
    />
  );
}
