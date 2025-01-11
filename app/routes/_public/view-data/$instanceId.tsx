import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";

import { PageTitle } from "~/components/ui/typography";
import { instanceApi } from "~/serverHandlers/instance";

export const Route = createFileRoute("/_public/view-data/$instanceId")({
  component: RouteComponent,
  loader: async ({ params, context }) => {
    await context.queryClient.prefetchQuery(
      instanceApi.getLatestInstanceUpdate.getOptions({
        data: { instanceId: params.instanceId },
      }),
    );
  },
});

function RouteComponent() {
  const params = Route.useParams();
  const { data: lastInstanceUpdate } =
    instanceApi.getLatestInstanceUpdate.useQuery({
      variables: {
        data: { instanceId: params.instanceId },
      },
      refetchInterval: 10000,
    });

  return (
    <div className="p-4 grow flex flex-col">
      <PageTitle>Public Dashboard for "{params.instanceId}"</PageTitle>
      <p>
        Last update:{" "}
        {lastInstanceUpdate ? format(lastInstanceUpdate, "PPpp") : "N/A"}
      </p>
    </div>
  );
}
