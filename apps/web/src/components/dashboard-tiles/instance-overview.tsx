import { useSuspenseQuery } from "@tanstack/react-query";

import { formatUnit } from "~/lib/utils";
import { orpc } from "~/orpc/client";
import { Card, CardContent } from "../ui/card";

export function InstanceOverview({
  className,
  instanceId,
}: {
  className?: string;
  instanceId: string;
}) {
  const { data: statistics } = useSuspenseQuery(
    orpc.sites.getStatistics.queryOptions({ input: { instanceId } }),
  );
  const { data: instance } = useSuspenseQuery(
    orpc.instances.getById.queryOptions({ input: { id: instanceId } }),
  );

  const { data: loadingSessions } = useSuspenseQuery(
    orpc.loadingSessions.getExtractedSessions.queryOptions({
      input: { instanceIds: [instanceId] },
    }),
  );

  const { data: batteryMetaData } = useSuspenseQuery(
    orpc.batteries.getMetaData.queryOptions({ input: { instanceId } }),
  );

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-x-12 gap-y-8 md:grid-cols-5">
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
          {/* {instance.pvMaxPowerKw ? (
            <InstanceOverviewInfo
              title="PV Capacity"
              subtitle="(max in 365d)"
              value={formatUnit(instance.pvMaxPowerKw, "kW", 1)}
            />
          ) : null} */}
          {/* <InstanceOverviewInfo
            title="Battery Capacity"
            subtitle="(total)"
            value={formatUnit(batteryMetaData.data.totalCapacity, "kWh", 1)}
          /> */}
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
            <span className="text-muted-foreground text-xs">{subtitle}</span>
          </>
        )}
      </span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
}
