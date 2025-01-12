import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PublicSiteFooter } from "~/components/public-site-footer";
import { PublicSiteHeader } from "~/components/public-site-header";

export const Route = createFileRoute("/_public")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PublicSiteHeader />
      <main className="relative flex flex-1 grow flex-col max-w-full bg-background">
        <Outlet />
      </main>
      <PublicSiteFooter />
    </>
  );
}
