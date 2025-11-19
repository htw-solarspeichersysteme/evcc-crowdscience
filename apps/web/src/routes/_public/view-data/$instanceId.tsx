import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { StateTimelineChart } from "~/components/charts/state-timeline-chart";
import { InstanceTimeSeriesEcharts } from "~/components/charts/time-series-chart";
import { MetadataGraph } from "~/components/dashboard-graph";
import { PageTitle } from "~/components/ui/typography";
import { singleInstanceRouteSearchSchema } from "~/lib/globalSchemas";
import { formatCount, formatUnit } from "~/lib/utils";
import { ensureDefaultChartTopicField } from "~/middleware/searchValidationHelpers";
import { orpc } from "~/orpc/client";

export const Route = createFileRoute("/_public/view-data/$instanceId")({
  component: RouteComponent,
  validateSearch: singleInstanceRouteSearchSchema,
  loaderDeps: (r) => r.search,
  beforeLoad: ({ search }) => {
    ensureDefaultChartTopicField(search.chartTopic, search.chartTopicField);
  },
  loader: async ({ context, params, deps }) => {
    const queryOptions = [
      orpc.instances.getSendingActivity.queryOptions({
        input: { instanceId: params.instanceId, timeRange: deps.timeRange },
      }),
      orpc.sites.getMetaDataValues.queryOptions({
        input: { instanceId: params.instanceId },
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
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const activity = useSuspenseQuery(
    orpc.instances.getSendingActivity.queryOptions({
      input: { instanceId, timeRange: search.timeRange },
    }),
  );
  const siteMetaData = useSuspenseQuery(
    orpc.sites.getMetaDataValues.queryOptions({ input: { instanceId } }),
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
          className="col-span-2 h-[10px] overflow-hidden rounded-md border shadow-xs md:col-span-4 md:h-[20px] lg:col-span-8 xl:col-span-12"
        />
        <InstanceTimeSeriesEcharts
          className="col-span-full"
          instanceId={instanceId}
          chartTopic={search.chartTopic}
          chartTopicField={search.chartTopicField}
          handleChartTopicChange={(chartTopic, chartTopicField) =>
            navigate({
              replace: true,
              search: (prev) => ({ ...prev, chartTopic, chartTopicField }),
            })
          }
        />
        <MetadataGraph
          title="Site Metadata"
          expandKey="site-metadata"
          mainContent={<div>{siteMetaData.data?.siteTitle?.value}</div>}
          metaData={{
            count: 1,
            values: { "Instance Site": siteMetaData.data },
          }}
          className="col-span-2"
        />
        <MetadataGraph
          title="Vehicle Metadata"
          expandKey="vehicle-metadata"
          mainContent={
            <div>
              {formatCount(vehicleMetaData.data.count, "Vehicle", "Vehicles")}
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
              {formatCount(
                loadpointMetaData.data.count,
                "Loadpoint",
                "Loadpoints",
              )}
            </div>
          }
          metaData={loadpointMetaData.data}
          className="col-span-2"
        />
        <MetadataGraph
          title="PV Metadata"
          expandKey="pv-metadata"
          mainContent={
            <div>{formatCount(pvMetaData.data.count, "PV", "PVs")}</div>
          }
          metaData={pvMetaData.data}
          className="col-span-2"
        />
        <MetadataGraph
          title="Battery Metadata"
          expandKey="battery-metadata"
          mainContent={
            <div>
              {formatCount(batteryMetaData.data.count, "Battery", "Batteries")}
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
                statistics.data.values["30d"]?.chargedKWh?.value as number,
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
      </div>
    </>
  );
}
