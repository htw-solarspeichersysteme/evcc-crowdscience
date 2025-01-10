import { createFileRoute, type MakeRouteMatch } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { ExpandableDashboardGraph } from "~/components/dashboard-graph";
import { DataTable } from "~/components/data-table";
import { ExtractSessions } from "~/components/extract-sessions";
import { InstanceTimeSeriesViewer } from "~/components/instance-time-series-viewer";
import { possibleInstanceTimeSeriesMetrics } from "~/constants";
import { instanceApi } from "~/serverHandlers/instance";
import { siteApi } from "~/serverHandlers/site";

export const Route = createFileRoute("/dashboard/instances/$instanceId")({
  component: RouteComponent,
  validateSearch: zodValidator(
    z.object({
      expandedKey: z.string().optional(),
      timeSeriesMetric: z
        .enum(possibleInstanceTimeSeriesMetrics)
        .default("batterySoc"),
    }),
  ),
  loaderDeps: (r) => ({
    timeSeriesMetric: r.search.timeSeriesMetric,
  }),
  loader: async ({ params, context, deps }) => {
    const promises = [
      context.queryClient.prefetchQuery(
        siteApi.getSiteMetaData.getOptions({
          data: { instanceId: params.instanceId },
        }),
      ),
      deps.timeSeriesMetric &&
        context.queryClient.prefetchQuery(
          instanceApi.getTimeSeriesData.getOptions({
            data: {
              metric: deps.timeSeriesMetric,
              instanceId: params.instanceId,
            },
          }),
        ),
    ];

    await Promise.allSettled(promises);
  },
  staticData: {
    routeTitle: (r: MakeRouteMatch<typeof Route>) => {
      return `${r.params.instanceId}`;
    },
  },
  wrapInSuspense: true,
});

function RouteComponent() {
  const { instanceId } = Route.useParams();

  const siteMetaData = siteApi.getSiteMetaData.useSuspenseQuery({
    variables: { data: { instanceId } },
  });

  return (
    <div className="md:grids-col-2 grid md:gap-4 lg:grid-cols-10 xl:grid-cols-11 xl:gap-4 gap-2">
      <InstanceTimeSeriesViewer className="col-span-3 lg:col-span-full" />
      <ExpandableDashboardGraph
        title="Metadata"
        className="col-span-3"
        expandKey="metadata"
        mainContent={<div>version: {siteMetaData.data?.version?.value}</div>}
        expandContent={
          <DataTable
            data={
              siteMetaData.data
                ? Object.entries(siteMetaData.data).map(([key, value]) => ({
                    field: key,
                    value: value?.value,
                    lastUpdate: value?.lastUpdate,
                  }))
                : []
            }
            columns={[
              {
                accessorKey: "field",
                header: "Field",
              },
              {
                accessorKey: "value",
                header: "Value",
              },
            ]}
          />
        }
      />
      <ExtractSessions
        instanceId={instanceId}
        className="flex flex-col gap-2 md:gap-4 lg:col-span-full col-span-3"
      />
    </div>
  );
}
