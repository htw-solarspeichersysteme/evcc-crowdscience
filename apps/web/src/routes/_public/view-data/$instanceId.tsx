import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";

import { StateTimelineChart } from "~/components/charts/state-timeline-chart";
import { InstanceOverview } from "~/components/dashboard-tiles/instance-overview";
import { InstanceTimeSeriesViewer } from "~/components/instance-time-series-viewer";
import { PageTitle } from "~/components/ui/typography";
import { singleInstanceRouteSearchSchema } from "~/lib/globalSchemas";
import { orpc } from "~/orpc/client";
import { instanceApi } from "~/serverHandlers/instance/serverFns";

export const Route = createFileRoute("/_public/view-data/$instanceId")({
  component: RouteComponent,
  validateSearch: zodValidator(singleInstanceRouteSearchSchema),
  loaderDeps: (r) => r.search,
  loader: async ({ context, params, deps }) => {
    const queryOptions = [
      orpc.instances.getSendingActivity.queryOptions({
        input: { instanceId: params.instanceId, timeRange: deps.timeRange },
      }),
      instanceApi.getTimeSeriesData.getOptions({
        data: {
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
      </div>
    </>
  );
}
