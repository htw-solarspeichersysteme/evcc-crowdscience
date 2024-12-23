import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/instances")({
  component: RouteComponent,
  staticData: {
    routeTitle: "Instances",
  },
});

function RouteComponent() {
  return <Outlet />;
}
