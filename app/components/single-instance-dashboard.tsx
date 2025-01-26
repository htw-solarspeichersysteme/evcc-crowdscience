import { useQueryClient } from "@tanstack/react-query";
import { useParams, useSearch } from "@tanstack/react-router";
import { differenceInSeconds } from "date-fns";
import { RefreshCcwIcon, TrashIcon } from "lucide-react";

import { formatSecondsInHHMM, formatUnit } from "~/lib/utils";
import { batteryApi } from "~/serverHandlers/battery";
import { instanceApi } from "~/serverHandlers/instance/serverFns";
import { loadingSessionApi } from "~/serverHandlers/loadingSession/serverFns";
import { loadPointApi } from "~/serverHandlers/loadpoint";
import { pvApi } from "~/serverHandlers/pv";
import { siteApi } from "~/serverHandlers/site";
import { vehicleApi } from "~/serverHandlers/vehicle";
import { StateTimelineChart } from "./charts/state-timeline-chart";
import { ExpandableDashboardGraph, MetadataGraph } from "./dashboard-graph";
import { BatteryInfo } from "./dashboard-tiles/battery-info";
import { ChargingHourHistogram } from "./dashboard-tiles/charging-hour-histogram";
import { DataTable } from "./data-table";
import { ExportLoadingSessionsButton } from "./export-loading-sessions-button";
import { InstanceTimeSeriesViewer } from "./instance-time-series-viewer";
import { TimeSeriesSettingsPicker } from "./time-series-settings-picker";
import { LoadingButton } from "./ui/button";

export function SingleInstanceDashboard({
  publicView,
}: {
  publicView: boolean;
}) {
  const queryClient = useQueryClient();
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
  const extractedSessions =
    loadingSessionApi.getExtractedSessions.useSuspenseQuery({
      variables: { data: { instanceIds: [instanceId] } },
    });

  const invalidateExtractedSessions = () =>
    queryClient.refetchQueries({
      queryKey: ["loadingSession", "getExtractedSessions"],
    });

  const triggerExtraction = loadingSessionApi.triggerExtraction.useMutation({
    onSuccess: invalidateExtractedSessions,
  });

  const deleteExtractedSessions =
    loadingSessionApi.deleteExtractedSessions.useMutation({
      onSuccess: invalidateExtractedSessions,
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
      <ExpandableDashboardGraph
        title="Extracted Sessions"
        expandKey="extracted-sessions"
        dialogClassName="w-full lg:max-w-[90vw]"
        mainContent={
          <div className="flex flex-row items-center justify-between">
            {extractedSessions.data.length} Session
            {extractedSessions.data.length > 1 ? "s" : ""}
          </div>
        }
        className="col-span-3"
        expandContent={
          <div className="flex flex-col gap-2 w-full overflow-x-auto">
            <div className="flex flex-row items-center justify-end gap-2">
              <LoadingButton
                variant="outline"
                size="icon"
                onClick={() =>
                  triggerExtraction.mutateAsync({ data: { instanceId } })
                }
                icon={<RefreshCcwIcon className="w-4 h-4" />}
              />
              <LoadingButton
                variant="outline"
                size="icon"
                onClick={() =>
                  deleteExtractedSessions.mutateAsync({
                    data: { instanceIds: [instanceId] },
                  })
                }
                icon={<TrashIcon className="w-4 h-4" />}
              />
              <ExportLoadingSessionsButton data={extractedSessions.data} />
            </div>

            <DataTable
              data={extractedSessions.data}
              columns={[
                { accessorKey: "startTime", header: "Start" },
                { accessorKey: "endTime", header: "End" },
                {
                  accessorFn: (row) => {
                    const difference = differenceInSeconds(
                      row.endTime,
                      row.startTime,
                    );

                    return formatSecondsInHHMM(difference);
                  },
                  header: "Total Duration",
                },
                {
                  accessorFn: (row) => {
                    return formatSecondsInHHMM(row.duration);
                  },
                  header: "Active Duration",
                },
                { accessorKey: "componentId", header: "Component" },
                { accessorKey: "price", header: "Price" },
                { accessorKey: "solarPercentage", header: "Solar" },
                { accessorKey: "maxChargePower", header: "Max Charge Power" },
                { accessorKey: "maxPhasesActive", header: "Max Phases Active" },
                { accessorKey: "startSoc", header: "Start SoC" },
                { accessorKey: "endSoc", header: "End SoC" },
                { accessorKey: "startRange", header: "Start Range" },
                { accessorKey: "endRange", header: "End Range" },
                { accessorKey: "limitSoc", header: "Limit SoC" },
                { accessorKey: "chargedEnergy", header: "Charged Energy" },
                { accessorKey: "sessionEnergy", header: "Session Energy" },
              ]}
            />
          </div>
        }
      />
    </div>
  );
}
