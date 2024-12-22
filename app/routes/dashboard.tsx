import { createFileRoute, Outlet } from "@tanstack/react-router";

import { useAuth } from "~/auth";
import { Breadcrumbs } from "~/components/app-breadcrumbs";
import { AppSidebar } from "~/components/app-sidebar";
import { DynamicPageTitle } from "~/components/dynamic-pagetitle";
import { LoginForm } from "~/components/login-form";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { Toaster } from "~/components/ui/toaster";
import { getCookie } from "~/serverHandlers/headers";

export const Route = createFileRoute("/dashboard")({
  component: () => {
    const { session } = useAuth();

    if (!session?.user) {
      return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      );
    }
    return <RouteComponent />;
  },
  loader: async () => {
    return {
      sidebarOpen: (await getCookie({ data: "sidebar:state" })) === "true",
    };
  },
  staleTime: 1000 * 60 * 60,
  staticData: {
    routeTitle: "Dashboard",
  },
});

function RouteComponent() {
  const session = Route.useRouteContext().session;
  const sidebarOpen = Route.useLoaderData().sidebarOpen;

  return (
    <div className="h-screen w-screen max-w-screen">
      <SidebarProvider defaultOpen={sidebarOpen}>
        <SidebarInset variant="inset">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <Breadcrumbs />
            <SidebarTrigger className="-mr-1 ml-auto rotate-180" />
          </header>
          <div className="p-4 ">
            <DynamicPageTitle />
            <Outlet />
          </div>
          <Toaster />
        </SidebarInset>
        <AppSidebar user={session?.user} side="right" variant="inset" />
      </SidebarProvider>
    </div>
  );
}
