import { AppSidebar } from "~/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { Toaster } from "~/components/ui/toaster";
import { auth } from "~/server/auth";

export default async function DashboardLayout({
  children,
  breadcrumbs,
}: Readonly<{ children: React.ReactNode; breadcrumbs: React.ReactNode }>) {
  const session = await auth();
  return (
    <SidebarProvider>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          {breadcrumbs}
          <SidebarTrigger className="-mr-1 ml-auto rotate-180" />
        </header>
        <main className="p-4 max-w-md">{children}</main>
        <Toaster />
      </SidebarInset>
      <AppSidebar user={session?.user} />
    </SidebarProvider>
  );
}
