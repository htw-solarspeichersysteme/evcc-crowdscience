import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  redirect,
  type MakeRouteMatch,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";

import { StateTimelineChart } from "~/components/charts/state-timeline-chart";
import { MetadataGraph } from "~/components/dashboard-graph";
import { BatteryInfo } from "~/components/dashboard-tiles/battery-info";
import { ChargingHourHistogram } from "~/components/dashboard-tiles/charging-hour-histogram";
import { ExtractedSessions } from "~/components/dashboard-tiles/extracted-sessions-overview";
import { ImportedSessions } from "~/components/dashboard-tiles/imported-sessions-overview";
import { InstanceOverview } from "~/components/dashboard-tiles/instance-overview";
import { StartSocHistogram } from "~/components/dashboard-tiles/start-soc-histogram";
import { InstanceTimeSeriesViewer } from "~/components/instance-time-series-viewer";
import { singleInstanceRouteSearchSchema } from "~/lib/globalSchemas";
import { formatUnit } from "~/lib/utils";
import { orpc } from "~/orpc/client";
import { batteryApi } from "~/serverHandlers/battery";
import { instanceApi } from "~/serverHandlers/instance/serverFns";
import { loadingSessionApi } from "~/serverHandlers/loadingSession/serverFns";
import { loadPointApi } from "~/serverHandlers/loadpoint";
import { pvApi } from "~/serverHandlers/pv";
import { siteApi } from "~/serverHandlers/site";
import { vehicleApi } from "~/serverHandlers/vehicle";

export const Route = createFileRoute("/dashboard/instances/$instanceId")({
  component: RouteComponent,
  validateSearch: zodValidator(singleInstanceRouteSearchSchema),
  loaderDeps: (r) => ({
    timeSeriesMetric: r.search.timeSeriesMetric,
    timeRange: r.search.timeRange,
  }),
  beforeLoad: async ({ params, context }) => {
    const instance = await context.queryClient.fetchQuery(
      orpc.instances.getById.queryOptions({
        input: { id: params.instanceId },
      }),
    );

    return { instance };
  },
  loader: async ({ context, deps }) => {
    const { instance } = context;
    const { timeSeriesMetric, timeRange } = deps;
    const instanceId = instance.id;
    const queryOptions = [
      ...[
        vehicleApi.getVehicleMetaData,
        loadPointApi.getLoadPointMetaData,
        pvApi.getPvMetaData,
        batteryApi.getBatteryMetaData,
      ].map((api) => api.getOptions({ data: { instanceId } })),
      siteApi.getSiteMetaData.getOptions({ data: { instanceId } }),
      siteApi.getSiteStatistics.getOptions({ data: { instanceId } }),
      instanceApi.getTimeSeriesData.getOptions({
        data: { metric: timeSeriesMetric, instanceId, timeRange },
      }),

      loadingSessionApi.getExtractedSessions.getOptions({
        data: { instanceIds: [instanceId] },
      }),
      loadingSessionApi.getImportedSessions.getOptions({
        data: { instanceIds: [instanceId] },
      }),
      instanceApi.getChargingHourHistogram.getOptions({
        data: { instanceIds: [instanceId] },
      }),
      orpc.instances.getSendingActivity.queryOptions({
        input: { instanceId, timeRange },
      }),
    ];

    await Promise.allSettled(
      queryOptions.map((queryOption) =>
        // @ts-ignore
        context.queryClient.ensureQueryData(queryOption),
      ),
    );
  },
  staticData: {
    routeTitle: (r: MakeRouteMatch<typeof Route>) => {
      return `${r.context.instance?.publicName ?? "Instance not found"}`;
    },
  },
});

function RouteComponent() {
  const { instance } = Route.useRouteContext();
  const { timeSeriesMetric, timeRange } = Route.useSearch();
  const instanceId = instance.id;

  const activity = useSuspenseQuery(
    orpc.instances.getSendingActivity.queryOptions({
      input: { instanceId, timeRange },
    }),
  );
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

  return (
    <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-4 md:gap-4 lg:grid-cols-8 xl:grid-cols-12">
      <StateTimelineChart
        data={activity.data}
        heightConfig={{ fixed: 100 }}
        className="shadow-xs col-span-2 h-[10px] overflow-hidden rounded-md border md:col-span-4 md:h-[20px] lg:col-span-8 xl:col-span-12"
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
            <span className="text-muted-foreground text-sm">
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
