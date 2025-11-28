import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Outlet,
  retainSearchParams,
} from "@tanstack/react-router";
import { createQuery } from "react-query-kit";
import * as z from "zod";

import { protectRoute } from "~/auth";
import { Breadcrumbs } from "~/components/app-breadcrumbs";
import { DynamicPageTitle } from "~/components/dynamic-pagetitle";
import { AppSidebar } from "~/components/sidebar/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { Toaster } from "~/components/ui/toaster";
import { instancesFilterSchema } from "~/lib/globalSchemas";
import { fetchCookie } from "~/serverHandlers/cookies";

const useSidebarState = createQuery({
  queryKey: ["sidebar", "state"],
  fetcher: async () => {
    const sideBardCookie = await fetchCookie({ data: "sidebar:state" });
    return {
      sidebarOpen: sideBardCookie ? sideBardCookie === "true" : true,
    };
  },
});

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  validateSearch: z.object({
    iFltr: instancesFilterSchema.optional(),
    filterExpanded: z.boolean().optional(),
    showIgnored: z.boolean().optional(),
  }),
  search: {
    middlewares: [
      retainSearchParams([
        "iFltr",
        "filterExpanded",
        "timeRange",
        "showIgnored",
      ]),
    ],
  },
  beforeLoad: (params) => {
    protectRoute(params);
    return { routeTitle: "Dashboard" };
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(useSidebarState.getOptions());
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
        onOpenChange={(open: boolean) =>
          queryClient.setQueryData(useSidebarState.getKey(), {
            sidebarOpen: open,
          })
        }
      >
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <Breadcrumbs />
            <SidebarTrigger className="ml-auto size-8 rotate-180 p-1 md:size-7 md:p-0" />
          </header>
          <div className="p-4">
            <DynamicPageTitle />
            <Outlet />
          </div>
          <Toaster />
        </SidebarInset>
        <AppSidebar side="right" />
      </SidebarProvider>
    </>
  );
}
