import { Link } from "@tanstack/react-router";
import {
  BirdIcon,
  CatIcon,
  ChevronsUpDown,
  FishIcon,
  LogOut,
  RabbitIcon,
  RatIcon,
  SnailIcon,
  SquirrelIcon,
  TurtleIcon,
} from "lucide-react";

import { useAuth } from "~/auth";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";

const icons = [
  RatIcon,
  BirdIcon,
  SnailIcon,
  SquirrelIcon,
  FishIcon,
  CatIcon,
  RabbitIcon,
  TurtleIcon,
];

export function NavUser() {
  const { isMobile } = useSidebar();
  const { logout, session } = useAuth();

  if (!session?.user) return null;

  const name = session.user.firstName + " " + session.user.lastName;
  const UserIcon = icons[name.length % icons.length];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-full bg-darkaccent">
                  <UserIcon className="size-5 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{name}</span>
                <span className="truncate text-xs">{session.user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-full bg-darkaccent">
                    <UserIcon className="size-5 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{name}</span>
                  <span className="truncate text-xs">{session.user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuItem asChild>
              <Link
                to="/dashboard/users"
                search={{ action: "edit", userId: session.user.id }}
              >
                Change password
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
