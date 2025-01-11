import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PublicSiteFooter } from "~/components/public-site-footer";
import { PublicSiteHeader } from "~/components/public-site-header";

export const Route = createFileRoute("/_public")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col w-screen min-h-screen max-w-screen bg-sidebar">
      <main className="relative flex flex-1 flex-col max-w-full bg-background min-h-[calc(100svh-theme(spacing.4))] md:m-2 md:rounded-xl md:shadow md:mr-2">
        <PublicSiteHeader />
        <div className="p-4 grow flex flex-col">
          <Outlet />
        </div>
        <PublicSiteFooter />
      </main>
    </div>
  );
}
