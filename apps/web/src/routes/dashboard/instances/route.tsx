import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/instances")({
  component: RouteComponent,
  beforeLoad: () => ({
    routeTitle: "Instances",
  }),
});

function RouteComponent() {
  return <Outlet />;
}
