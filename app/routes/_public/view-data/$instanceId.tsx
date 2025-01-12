import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";

import { SingleInstanceDashboard } from "~/components/single-instance-dashboard";
import { PageTitle } from "~/components/ui/typography";
import { singleInstanceRouteSearchSchema } from "~/routes/dashboard/instances/$instanceId";

export const Route = createFileRoute("/_public/view-data/$instanceId")({
  component: RouteComponent,
  validateSearch: zodValidator(singleInstanceRouteSearchSchema),
});

function RouteComponent() {
  return (
    <div className="p-4 grow flex flex-col">
      <PageTitle>View Your Data</PageTitle>
      <SingleInstanceDashboard publicView={true} />
    </div>
  );
}
