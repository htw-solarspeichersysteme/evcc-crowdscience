import type { QueryClient } from "@tanstack/react-query";
import { createFileRoute, type MakeRouteMatch } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";

import { SingleInstanceDashboard } from "~/components/single-instance-dashboard";
import { type possibleInstanceTimeSeriesMetrics } from "~/constants";
import {
  singleInstanceRouteSearchSchema,
  type UrlTimeRange,
} from "~/lib/globalSchemas";
import { orpc } from "~/orpc/client";
import { batteryApi } from "~/serverHandlers/battery";
import { instanceApi } from "~/serverHandlers/instance/serverFns";
import { loadingSessionApi } from "~/serverHandlers/loadingSession/serverFns";
import { loadPointApi } from "~/serverHandlers/loadpoint";
import { pvApi } from "~/serverHandlers/pv";
import { siteApi } from "~/serverHandlers/site";
import { vehicleApi } from "~/serverHandlers/vehicle";

export const singleInstancePreloadingPromises = ({
  queryClient,
  instanceId,
  timeSeriesMetric,
  timeRange,
}: {
  queryClient: QueryClient;
  instanceId: string;
  timeSeriesMetric: (typeof possibleInstanceTimeSeriesMetrics)[number];
  timeRange: UrlTimeRange;
}) => [
  ...[
    vehicleApi.getVehicleMetaData,
    loadPointApi.getLoadPointMetaData,
    pvApi.getPvMetaData,
    batteryApi.getBatteryMetaData,
  ].map((api) =>
    queryClient.prefetchQuery(
      api.getOptions({
        data: { instanceId },
      }),
    ),
  ),
  queryClient.prefetchQuery(
    siteApi.getSiteMetaData.getOptions({
      data: { instanceId },
    }),
  ),
  queryClient.prefetchQuery(
    siteApi.getSiteStatistics.getOptions({
      data: { instanceId },
    }),
  ),
  queryClient.prefetchQuery(
    instanceApi.getTimeSeriesData.getOptions({
      data: {
        metric: timeSeriesMetric,
        instanceId,
        timeRange,
      },
    }),
  ),
  queryClient.prefetchQuery(
    instanceApi.getSendingActivity.getOptions({
      data: { instanceId, timeRange },
    }),
  ),
  queryClient.prefetchQuery(
    loadingSessionApi.getExtractedSessions.getOptions({
      data: { instanceIds: [instanceId] },
    }),
  ),
  queryClient.prefetchQuery(
    loadingSessionApi.getImportedSessions.getOptions({
      data: { instanceIds: [instanceId] },
    }),
  ),
  queryClient.prefetchQuery(
    orpc.instances.getById.queryOptions({
      input: instanceId,
    }),
  ),
  queryClient.prefetchQuery(
    instanceApi.getChargingHourHistogram.getOptions({
      data: { instanceIds: [instanceId] },
    }),
  ),
];

export const Route = createFileRoute("/dashboard/instances/$instanceId")({
  component: RouteComponent,
  validateSearch: zodValidator(singleInstanceRouteSearchSchema),
  loaderDeps: (r) => ({
    timeSeriesMetric: r.search.timeSeriesMetric,
    timeRange: r.search.timeRange,
  }),
  loader: async ({ params, context, deps }) => {
    await Promise.allSettled(
      singleInstancePreloadingPromises({
        queryClient: context.queryClient,
        instanceId: params.instanceId,
        timeSeriesMetric: deps.timeSeriesMetric,
        timeRange: deps.timeRange,
      }),
    );
  },
  staticData: {
    routeTitle: (r: MakeRouteMatch<typeof Route>) => {
      return `${r.params.instanceId}`;
    },
  },
});

function RouteComponent() {
  return <SingleInstanceDashboard publicView={false} />;
}
