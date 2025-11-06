import { sum } from "simple-statistics";

import { formatUnit } from "~/lib/utils";
import type { MetaData } from "~/orpc/types";
import { MetadataGraph } from "../dashboard-graph";

export function calculateBatteryInfo(batteryMetaData: MetaData) {
  const count = batteryMetaData.count;
  const totalCapacity = sum(
    Object.entries(batteryMetaData.values).map(
      ([_, value]) => +(value?.capacity?.value ?? 0),
    ),
  );
  const avgCapacity = totalCapacity / count;
  return { totalCapacity, avgCapacity };
}

export function BatteryInfo({
  batteryMetaData,
  className,
}: {
  batteryMetaData: MetaData;
  className?: string;
}) {
  const { avgCapacity } = calculateBatteryInfo(batteryMetaData);
  const count = batteryMetaData.count;

  return (
    <MetadataGraph
      title="Battery Info"
      expandKey="battery-metadata"
      className={className}
      mainContent={
        <div className="flex flex-col gap-2">
          <span>
            {count} Batter
            {count === 0 || count > 1 ? "ies" : "y"}
          </span>
          <span className="text-muted-foreground text-sm">
            ø {formatUnit(avgCapacity, "kWh", 1)}
          </span>
        </div>
      }
      metaData={batteryMetaData}
    />
  );
}
