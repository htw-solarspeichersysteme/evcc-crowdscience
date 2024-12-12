import { Suspense } from "react";
import { cookies } from "next/headers";

import { Breadcrumbs } from "~/components/app-breadcrumbs";
import { AppSidebar } from "~/components/app-sidebar";
import { DynamicPageTitle } from "~/components/dynamic-pagetitle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { Toaster } from "~/components/ui/toaster";
import { auth } from "~/server/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
  metas: {
    title: string;
  };
}>) {
  const cookieStore = await cookies();
  const session = await auth();
  const sideBardefaultOpen = cookieStore.get("sidebar:state")?.value === "true";

  return (
    <div className="h-screen w-screen max-w-screen">
      <SidebarProvider defaultOpen={sideBardefaultOpen}>
        <SidebarInset variant="inset">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <Breadcrumbs />
            <SidebarTrigger className="-mr-1 ml-auto rotate-180" />
          </header>
          <div className="p-4 ">
            <DynamicPageTitle />
            <Suspense>{children}</Suspense>
          </div>
          <Toaster />
        </SidebarInset>
        <AppSidebar user={session?.user} side="right" variant="inset" />
      </SidebarProvider>
    </div>
  );
}
