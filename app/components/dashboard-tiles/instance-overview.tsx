import { formatUnit } from "~/lib/utils";
import { batteryApi } from "~/serverHandlers/battery";
import { instanceApi } from "~/serverHandlers/instance/serverFns";
import { loadingSessionApi } from "~/serverHandlers/loadingSession/serverFns";
import { siteApi } from "~/serverHandlers/site";
import { Card, CardContent } from "../ui/card";
import { calculateBatteryInfo } from "./battery-info";

export function InstanceOverview({
  className,
  instanceId,
}: {
  className?: string;
  instanceId: string;
}) {
  const { data: statistics } = siteApi.getSiteStatistics.useSuspenseQuery({
    variables: { data: { instanceId } },
  });
  const { data: instance } = instanceApi.getActiveInstances.useSuspenseQuery({
    variables: { data: { instanceId } },
    select: (data) => data[0],
  });
  const batteryMetaData = batteryApi.getBatteryMetaData.useSuspenseQuery({
    variables: { data: { instanceId } },
    select: (data) => calculateBatteryInfo(data),
  });

  const { data: loadingSessions } =
    loadingSessionApi.getExtractedSessions.useSuspenseQuery({
      variables: { data: { instanceIds: [instanceId] } },
    });

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex gap-12">
          <InstanceOverviewInfo
            title="Sessions"
            subtitle="(total)"
            value={loadingSessions?.length.toString()}
          />
          {statistics?.["30d"]?.chargedKWh?.value ? (
            <InstanceOverviewInfo
              title="Charging Usage"
              subtitle="(30d)"
              value={formatUnit(
                statistics?.["30d"]?.chargedKWh?.value / 30,
                "kWh / d",
                1,
              )}
            />
          ) : null}
          {statistics?.["30d"]?.solarPercentage?.value ? (
            <InstanceOverviewInfo
              title="Solar"
              subtitle="(30d)"
              value={formatUnit(
                statistics?.["30d"]?.solarPercentage?.value,
                "%",
                1,
              )}
            />
          ) : null}
          {instance.pvPower ? (
            <InstanceOverviewInfo
              title="PV Capacity"
              subtitle="(max in 365d)"
              value={formatUnit(instance.pvPower, "kW", 1)}
            />
          ) : null}
          <InstanceOverviewInfo
            title="Battery Capacity"
            subtitle="(total)"
            value={formatUnit(batteryMetaData.data.totalCapacity, "kWh", 1)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function InstanceOverviewInfo({
  title,
  subtitle,
  value,
}: {
  title: string;
  subtitle?: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span>
        {title}
        {subtitle && (
          <>
            {" "}
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          </>
        )}
      </span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
}
