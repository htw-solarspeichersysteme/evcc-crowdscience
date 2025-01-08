import { createFileRoute } from "@tanstack/react-router";

import { PageTitle } from "~/components/ui/typography";

export const Route = createFileRoute("/_public/view-data/$instanceId")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  return (
    <>
      <PageTitle>Public Dashboard for "{params.instanceId}"</PageTitle>
    </>
  );
}
