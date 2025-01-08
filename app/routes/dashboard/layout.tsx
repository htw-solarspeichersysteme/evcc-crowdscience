import { createFileRoute, Outlet } from "@tanstack/react-router";

import { protectRoute } from "~/auth";
import { Breadcrumbs } from "~/components/app-breadcrumbs";
import { AppSidebar } from "~/components/app-sidebar";
import { DynamicPageTitle } from "~/components/dynamic-pagetitle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { Toaster } from "~/components/ui/toaster";
import { getCookie } from "~/serverHandlers/headers";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: protectRoute,
  loader: async () => {
    const sideBardCookie = await getCookie({ data: "sidebar:state" });
    return {
      sidebarOpen: sideBardCookie ? sideBardCookie === "true" : true,
    };
  },
  staleTime: 1000 * 60 * 60,
  staticData: {
    routeTitle: "Dashboard",
  },
});

function RouteComponent() {
  const sidebarOpen = Route.useLoaderData().sidebarOpen;

  return (
    <div className="w-screen h-screen max-w-screen">
      <SidebarProvider defaultOpen={sidebarOpen}>
        <SidebarInset variant="inset">
          <header className="flex items-center h-16 gap-2 px-4 border-b shrink-0">
            <Breadcrumbs />
            <SidebarTrigger className="ml-auto -mr-1 rotate-180" />
          </header>
          <div className="p-4 ">
            <DynamicPageTitle />
            <Outlet />
          </div>
          <Toaster />
        </SidebarInset>
        <AppSidebar side="right" variant="inset" />
      </SidebarProvider>
    </div>
  );
}
