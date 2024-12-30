import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ImportIcon,
  LayoutDashboardIcon,
  LifeBuoy,
  Send,
  ServerIcon,
  UsersIcon,
  WebhookIcon,
} from "lucide-react";

import { NavMain } from "~/components/nav-main";
import { NavSecondary } from "~/components/nav-secondary";
import { NavUser } from "~/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import type { SessionUser } from "~/serverHandlers/userSession";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
      isActive: true,
    },
    {
      title: "Instances",
      url: "/dashboard/instances",
      icon: ServerIcon,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: UsersIcon,
    },
    {
      title: "Import",
      url: "/dashboard/import",
      icon: ImportIcon,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
};

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar> & { user?: SessionUser }) {
  const sidebar = useSidebar();
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                to="/"
                onClick={() => sidebar.isMobile && sidebar.setOpenMobile(false)}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <WebhookIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Octopoda</span>
                  <span className="truncate text-xs">Analytics</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {props.user ? <NavUser user={props.user} /> : null}
      </SidebarFooter>
    </Sidebar>
  );
}
