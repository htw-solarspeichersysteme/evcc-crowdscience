import { useParams, useSearch } from "@tanstack/react-router";

import { formatUnit } from "~/lib/utils";
import { batteryApi } from "~/serverHandlers/battery";
import { instanceApi } from "~/serverHandlers/instance";
import { loadPointApi } from "~/serverHandlers/loadpoint";
import { pvApi } from "~/serverHandlers/pv";
import { siteApi } from "~/serverHandlers/site";
import { vehicleApi } from "~/serverHandlers/vehicle";
import { StateTimelineChart } from "./charts/state-timeline-chart";
import { MetadataGraph } from "./dashboard-graph";
import { BatteryInfo } from "./dashboard-tiles/battery-info";
import { ChargingHourHistogram } from "./dashboard-tiles/charging-hour-histogram";
import { ExtractSessions } from "./extract-sessions";
import { InstanceTimeSeriesViewer } from "./instance-time-series-viewer";
import { TimeSeriesSettingsPicker } from "./time-series-settings-picker";

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
    <div className="md:grid-cols-3 grid md:gap-4 xl:grid-cols-12 gap-2">
      <TimeSeriesSettingsPicker className="col-span-3 lg:col-span-full" />
      <StateTimelineChart
        data={activity.data}
        heightConfig={{ fixed: 30 }}
        className="col-span-3 lg:col-span-full h-[10px] md:h-[20px] rounded-md overflow-hidden border shadow-sm"
      />
      <InstanceTimeSeriesViewer
        className="col-span-3 lg:col-span-full xl:col-span-6 xl:row-span-3"
        instanceId={instanceId}
        shownMetricKey={timeSeriesMetric}
      />
      <BatteryInfo batteryMetaData={batteryMetaData.data} />
      <ChargingHourHistogram
        instanceIds={[instanceId]}
        className="col-span-3"
        linkToInstanceOnClick={false}
      />
      <MetadataGraph
        title="Site Metadata"
        expandKey="site-metadata"
        mainContent={<div>{siteMetaData.data?.siteTitle?.value}</div>}
        metaData={{ "Instance Site": siteMetaData.data }}
        className="col-span-3"
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
        className="col-span-3"
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
        className="col-span-3"
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
        className="col-span-3"
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
        className="col-span-3"
      />
      {!publicView && (
        <ExtractSessions
          instanceId={instanceId}
          className="flex flex-col gap-2 md:gap-4 lg:col-span-full col-span-3"
        />
      )}
    </div>
  );
}
