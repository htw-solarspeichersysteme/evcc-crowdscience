import { createFileRoute, useParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";

import { SingleInstanceDashboard } from "~/components/single-instance-dashboard";
import { PageTitle } from "~/components/ui/typography";
import { singleInstanceRouteSearchSchema } from "~/lib/globalSchemas";
import { singleInstancePreloadingPromises } from "~/routes/dashboard/instances/$publicName";

export const Route = createFileRoute("/_public/view-data/$instanceId")({
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
});

function RouteComponent() {
  const { instanceId } = useParams({ from: "/_public/view-data/$instanceId" });
  return (
    <>
      <PageTitle>Deine Datenübersicht</PageTitle>
      <SingleInstanceDashboard publicView={true} instanceId={instanceId} />
    </>
  );
}
