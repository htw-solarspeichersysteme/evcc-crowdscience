import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";

import { StateTimelineChart } from "~/components/charts/state-timeline-chart";
import { MetadataGraph } from "~/components/dashboard-graph";
import { InstanceTimeSeriesViewer } from "~/components/instance-time-series-viewer";
import { PageTitle } from "~/components/ui/typography";
import { singleInstanceRouteSearchSchema } from "~/lib/globalSchemas";
import { formatUnit } from "~/lib/utils";
import { orpc } from "~/orpc/client";

export const Route = createFileRoute("/_public/view-data/$instanceId")({
  component: RouteComponent,
  validateSearch: zodValidator(singleInstanceRouteSearchSchema),
  loaderDeps: (r) => r.search,
  loader: async ({ context, params, deps }) => {
    const queryOptions = [
      orpc.instances.getSendingActivity.queryOptions({
        input: { instanceId: params.instanceId, timeRange: deps.timeRange },
      }),
      orpc.sites.getMetaData.queryOptions({
        input: { instanceId: params.instanceId },
      }),
      orpc.timeSeries.getTimeSeriesData.queryOptions({
        input: {
          metric: deps.timeSeriesMetric,
          instanceId: params.instanceId,
          timeRange: deps.timeRange,
        },
      }),
    ];
    await Promise.allSettled(
      queryOptions.map((queryOption) =>
        // @ts-ignore
        context.queryClient.ensureQueryData(queryOption),
      ),
    );
  },
});

function RouteComponent() {
  const { instanceId } = Route.useParams();
  const { timeSeriesMetric, timeRange } = Route.useSearch();

  const activity = useSuspenseQuery(
    orpc.instances.getSendingActivity.queryOptions({
      input: { instanceId, timeRange },
    }),
  );
  const siteMetaData = useSuspenseQuery(
    orpc.sites.getMetaData.queryOptions({ input: { instanceId } }),
  );
  const vehicleMetaData = useSuspenseQuery(
    orpc.vehicles.getMetaData.queryOptions({ input: { instanceId } }),
  );
  const loadpointMetaData = useSuspenseQuery(
    orpc.loadpoints.getMetaData.queryOptions({ input: { instanceId } }),
  );
  const pvMetaData = useSuspenseQuery(
    orpc.pv.getMetaData.queryOptions({ input: { instanceId } }),
  );
  const batteryMetaData = useSuspenseQuery(
    orpc.batteries.getMetaData.queryOptions({ input: { instanceId } }),
  );
  const statistics = useSuspenseQuery(
    orpc.sites.getStatistics.queryOptions({ input: { instanceId } }),
  );

  return (
    <>
      <PageTitle>Deine Datenübersicht</PageTitle>
      <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-4 md:gap-4 lg:grid-cols-8 xl:grid-cols-12">
        <StateTimelineChart
          data={activity.data}
          heightConfig={{ fixed: 30 }}
          className="shadow-xs col-span-2 h-[10px] overflow-hidden rounded-md border md:col-span-4 md:h-[20px] lg:col-span-8 xl:col-span-12"
        />
        <InstanceTimeSeriesViewer
          className="col-span-full"
          instanceId={instanceId}
          shownMetricKey={timeSeriesMetric}
        />
        <MetadataGraph
          title="Site Metadata"
          expandKey="site-metadata"
          mainContent={<div>{siteMetaData.data?.siteTitle?.value}</div>}
          metaData={{ "Instance Site": siteMetaData.data }}
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
          title="Loadpoint Metadata"
          expandKey="loadpoints-metadata"
          mainContent={
            <div>
              {Object.keys(loadpointMetaData.data).length} Loadpoint
              {Object.keys(loadpointMetaData.data).length > 1 ? "s" : ""}
            </div>
          }
          metaData={loadpointMetaData.data}
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
          title="Battery Metadata"
          expandKey="battery-metadata"
          mainContent={
            <div>
              {Object.keys(batteryMetaData.data).length} Battery
              {Object.keys(batteryMetaData.data).length > 1 ? "s" : ""}
            </div>
          }
          metaData={batteryMetaData.data}
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
      </div>
    </>
  );
}
