import { useParams, useSearch } from "@tanstack/react-router";

import { StateTimelineChart } from "~/components/charts/state-timeline-chart";
import { MetadataGraph } from "~/components/dashboard-graph";
import { BatteryInfo } from "~/components/dashboard-tiles/battery-info";
import { ChargingHourHistogram } from "~/components/dashboard-tiles/charging-hour-histogram";
import { ExtractedSessions } from "~/components/dashboard-tiles/extracted-sessions-overview";
import { StartSocHistogram } from "~/components/dashboard-tiles/start-soc-histogram";
import { InstanceTimeSeriesViewer } from "~/components/instance-time-series-viewer";
import { formatUnit } from "~/lib/utils";
import { batteryApi } from "~/serverHandlers/battery";
import { instanceApi } from "~/serverHandlers/instance/serverFns";
import { loadPointApi } from "~/serverHandlers/loadpoint";
import { pvApi } from "~/serverHandlers/pv";
import { siteApi } from "~/serverHandlers/site";
import { vehicleApi } from "~/serverHandlers/vehicle";
import { ImportedSessions } from "./dashboard-tiles/imported-sessions-overview";
import { InstanceOverview } from "./dashboard-tiles/instance-overview";

export function SingleInstanceDashboard({
  publicView,
}: {
  publicView: boolean;
}) {
  const from = publicView
    ? "/_public/view-data/$instanceId"
    : "/dashboard/instances/$instanceId";

  const { timeSeriesMetric } = useSearch({ from });
  const { instanceId } = useParams({ from });

  const siteMetaData = siteApi.getSiteMetaData.useSuspenseQuery({
    variables: { data: { instanceId } },
  });
  const vehicleMetaData = vehicleApi.getVehicleMetaData.useSuspenseQuery({
    variables: { data: { instanceId } },
  });
  const loadPointMetaData = loadPointApi.getLoadPointMetaData.useSuspenseQuery({
    variables: { data: { instanceId } },
  });
  const pvMetaData = pvApi.getPvMetaData.useSuspenseQuery({
    variables: { data: { instanceId } },
  });
  const batteryMetaData = batteryApi.getBatteryMetaData.useSuspenseQuery({
    variables: { data: { instanceId } },
  });
  const statistics = siteApi.getSiteStatistics.useSuspenseQuery({
    variables: { data: { instanceId } },
  });
  const activity = instanceApi.getSendingActivity.useSuspenseQuery({
    variables: { data: { instanceId } },
  });
  if (!Object.keys(siteMetaData.data ?? {}).length) {
    return (
      <div>
        {publicView
          ? "Für diese Instanz wurden noch keine Daten empfangen"
          : "There is no data for this instance yet"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-4 lg:grid-cols-8 xl:grid-cols-12 w-full">
      <StateTimelineChart
        data={activity.data}
        heightConfig={{ fixed: 30 }}
        className="col-span-2 md:col-span-4 lg:col-span-8 xl:col-span-12 h-[10px] md:h-[20px] rounded-md overflow-hidden border shadow-sm"
      />
      <InstanceOverview
        className="col-span-2 md:col-span-4 lg:col-span-8 xl:col-span-12"
        instanceId={instanceId}
      />
      <InstanceTimeSeriesViewer
        className="col-span-2 md:col-span-4 lg:col-span-8 lg:row-span-4"
        instanceId={instanceId}
        shownMetricKey={timeSeriesMetric}
      />
      <StartSocHistogram
        title="Start SOC Distribution (last 30 days)"
        className="col-span-2 lg:col-span-4 lg:row-span-2"
        instanceIds={[instanceId]}
      />
      <ChargingHourHistogram
        instanceIds={[instanceId]}
        className="col-span-2 lg:col-span-4 lg:row-span-2"
        linkToInstanceOnClick={false}
      />
      <BatteryInfo
        batteryMetaData={batteryMetaData.data}
        className="col-span-2"
      />
      <MetadataGraph
        title="Site Metadata"
        expandKey="site-metadata"
        mainContent={<div>{siteMetaData.data?.siteTitle?.value}</div>}
        metaData={{ "Instance Site": siteMetaData.data }}
        className="col-span-2"
      />
      <MetadataGraph
        title="Loadpoint Metadata"
        expandKey="loadpoints-metadata"
        mainContent={
          <div>
            {Object.keys(loadPointMetaData.data).length} Loadpoint
            {Object.keys(loadPointMetaData.data).length > 1 ? "s" : ""}
          </div>
        }
        metaData={loadPointMetaData.data}
        className="col-span-2"
      />
      <MetadataGraph
        title="Vehicle Metadata"
        expandKey="vehicle-metadata"
        mainContent={
          <div>
            {Object.keys(vehicleMetaData.data).length} Vehicle
            {Object.keys(vehicleMetaData.data).length > 1 ? "s" : ""}
          </div>
        }
        metaData={vehicleMetaData.data}
        className="col-span-2"
      />
      <MetadataGraph
        title="PV Metadata"
        expandKey="pv-metadata"
        mainContent={
          <div>
            {Object.keys(pvMetaData.data).length} PV
            {Object.keys(pvMetaData.data).length > 1 ? "s" : ""}
          </div>
        }
        metaData={pvMetaData.data}
        className="col-span-2"
      />

      <MetadataGraph
        title="Statistics"
        expandKey="statistics"
        mainContent={
          <div>
            {formatUnit(
              statistics.data?.["30d"]?.chargedKWh?.value ?? 0,
              "kWh",
            )}{" "}
            Usage{" "}
            <span className="text-sm text-muted-foreground">
              (last 30 days)
            </span>
          </div>
        }
        metaData={statistics.data}
        className="col-span-2"
      />
      <ExtractedSessions instanceId={instanceId} className="col-span-2" />
      <ImportedSessions instanceId={instanceId} className="col-span-2" />
    </div>
  );
}
