import "~/styles/globals.css";

import { type Metadata } from "next";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { GeistSans } from "geist/font/sans";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { SidebarInset } from "~/components/ui/sidebar";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Octopoda",
  description: "Octopoda - EVCC Dataset Analyzer",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${GeistSans.variable}`}>
      <body>
        <TRPCReactProvider>
          <SidebarProvider>
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">
                        Building Your Application
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <SidebarTrigger className="-mr-1 ml-auto rotate-180" />
              </header>
              {children}
            </SidebarInset>
            <AppSidebar />
          </SidebarProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
