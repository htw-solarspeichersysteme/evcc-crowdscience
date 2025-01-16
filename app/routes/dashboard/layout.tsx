import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Outlet,
  retainSearchParams,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { createQuery } from "react-query-kit";
import { z } from "zod";

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
import { instancesFilterSchema } from "~/lib/globalSchemas";
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
  validateSearch: zodValidator(
    z.object({
      iFltr: instancesFilterSchema.optional(),
      filterExpanded: z.boolean().optional(),
    }),
  ),
  search: {
    middlewares: [retainSearchParams(["iFltr", "filterExpanded", "timeRange"])],
  },
  beforeLoad: protectRoute,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(useSidebarState.getOptions());
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
    <>
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
    </>
  );
}
