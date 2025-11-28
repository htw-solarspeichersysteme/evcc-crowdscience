import { createFileRoute, Outlet } from "@tanstack/react-router";

import { singleInstanceRouteSearchSchema } from "~/lib/globalSchemas";
import { ensureDefaultChartTopicField } from "~/middleware/searchValidationHelpers";
import { orpc } from "~/orpc/client";

export const Route = createFileRoute("/dashboard/instances/$instanceId")({
  component: RouteComponent,
  validateSearch: singleInstanceRouteSearchSchema,
  beforeLoad: async ({ params, context, search }) => {
    // load instance data
    const instance = await context.queryClient.ensureQueryData(
      orpc.instances.getById.queryOptions({
        input: { id: params.instanceId },
      }),
    );

    ensureDefaultChartTopicField(search.chartTopic, search.chartTopicField);

    return {
      instance,
      routeTitle: instance.publicName ?? "Instance not found",
    };
  },
});

function RouteComponent() {
  return <Outlet />;
}
