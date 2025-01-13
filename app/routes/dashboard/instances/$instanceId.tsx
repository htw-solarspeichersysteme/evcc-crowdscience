import type { QueryClient } from "@tanstack/react-query";
import { createFileRoute, type MakeRouteMatch } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { SingleInstanceDashboard } from "~/components/single-instance-dashboard";
import { possibleInstanceTimeSeriesMetrics } from "~/constants";
import { instanceApi } from "~/serverHandlers/instance";
import { siteApi } from "~/serverHandlers/site";

export const singleInstanceRouteSearchSchema = z.object({
  expandedKey: z.string().optional(),
  timeSeriesMetric: z
    .enum(possibleInstanceTimeSeriesMetrics)
    .default("batterySoc"),
});

export const singleInstancePreloadingPromises = ({
  queryClient,
  instanceId,
  timeSeriesMetric,
}: {
  queryClient: QueryClient;
  instanceId: string;
  timeSeriesMetric: (typeof possibleInstanceTimeSeriesMetrics)[number];
}) => [
  queryClient.prefetchQuery(
    siteApi.getSiteMetaData.getOptions({
      data: { instanceId },
    }),
  ),
  timeSeriesMetric &&
    queryClient.prefetchQuery(
      instanceApi.getTimeSeriesData.getOptions({
        data: {
          metric: timeSeriesMetric,
          instanceId,
        },
      }),
    ),
];

export const Route = createFileRoute("/dashboard/instances/$instanceId")({
  component: RouteComponent,
  validateSearch: zodValidator(singleInstanceRouteSearchSchema),
  loaderDeps: (r) => ({
    timeSeriesMetric: r.search.timeSeriesMetric,
  }),
  loader: async ({ params, context, deps }) => {
    await Promise.allSettled(
      singleInstancePreloadingPromises({
        queryClient: context.queryClient,
        instanceId: params.instanceId,
        timeSeriesMetric: deps.timeSeriesMetric,
      }),
    );
  },
  staticData: {
    routeTitle: (r: MakeRouteMatch<typeof Route>) => {
      return `${r.params.instanceId}`;
    },
  },
  wrapInSuspense: true,
});

function RouteComponent() {
  return <SingleInstanceDashboard publicView={false} />;
}
