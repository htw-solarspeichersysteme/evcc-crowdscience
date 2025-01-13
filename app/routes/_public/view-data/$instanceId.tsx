import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";

import { SingleInstanceDashboard } from "~/components/single-instance-dashboard";
import { PageTitle } from "~/components/ui/typography";
import {
  singleInstancePreloadingPromises,
  singleInstanceRouteSearchSchema,
} from "~/routes/dashboard/instances/$instanceId";

export const Route = createFileRoute("/_public/view-data/$instanceId")({
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
});

function RouteComponent() {
  return (
    <div className="p-4 grow flex flex-col">
      <PageTitle>Deine Datenübersicht</PageTitle>
      <SingleInstanceDashboard publicView={true} />
    </div>
  );
}
