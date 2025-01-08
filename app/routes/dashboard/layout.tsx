import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createQuery } from "react-query-kit";

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

const useSidebarState = createQuery({
  queryKey: ["sidebar", "state"],
  fetcher: async () => {
    const sideBardCookie = await getCookie({ data: "sidebar:state" });
    return {
      sidebarOpen: sideBardCookie ? sideBardCookie === "true" : true,
    };
  },
});

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: protectRoute,
  loader: async ({ context }) => {
    void context.queryClient.ensureQueryData(useSidebarState.getOptions());
  },
  staticData: {
    routeTitle: "Dashboard",
  },
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const { data: sidebarOpen } = useSidebarState({
    select: (data) => data.sidebarOpen,
  });

  return (
    <div className="w-screen h-screen max-w-screen">
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={(open) =>
          queryClient.setQueryData(useSidebarState.getKey(), {
            // @ts-expect-error maybe fix typeerror later
            sidebarOpen: open,
          })
        }
      >
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
