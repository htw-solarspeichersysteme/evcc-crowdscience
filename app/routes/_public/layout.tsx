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
      <main className="max-w-full bg-background p-6 grow">
        <Outlet />
      </main>
      <PublicSiteFooter />
    </>
  );
}
