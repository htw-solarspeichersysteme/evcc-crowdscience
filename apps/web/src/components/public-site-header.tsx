import { Link, type LinkProps } from "@tanstack/react-router";
import { GithubIcon, LayoutDashboardIcon, Rows3 } from "lucide-react";

import { useAuth } from "~/auth";
import { cn } from "~/lib/utils";
import { LogoIcon } from "./logo";

type IconLinkProps = {
  children: React.ReactNode;
  title: string;
  className?: string;
} & LinkProps;

export function IconLink({ children, to, className, ...props }: IconLinkProps) {
  const Component = to ? Link : "a";
  return (
    <Component
      to={to}
      className={cn(
        "rounded-md p-1 hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function PublicSiteHeader() {
  const { session } = useAuth();
  return (
    <header className="sticky top-0 z-50 h-16 w-full shrink-0 border-b bg-background px-4 sm:px-6 lg:px-10">
      <div className="mx-auto flex h-full w-full max-w-(--max-content-width) items-center">
        <IconLink
          to="/"
          title="Go To Home"
          className="mr-6 flex items-center gap-2"
        >
          <LogoIcon className="-mr-1" />
          <span className="hidden text-xl font-semibold sm:block">
            evcc-crowdscience
          </span>
        </IconLink>

        <div className="flex flex-1 items-center justify-end gap-2">
          <nav className="flex items-center gap-0.5">
            <IconLink
              to="/view-data"
              title="Meine Daten"
              className="mr-2 flex items-center gap-2"
            >
              <Rows3 className="size-6" />
              <span>Meine Daten</span>
            </IconLink>

            <IconLink
              href="https://github.com/htw-solarspeichersysteme/evcc-crowdscience"
              title="Go To GitHub"
              target="_blank"
            >
              <GithubIcon className="size-6" />
            </IconLink>
            {session?.user ? (
              <IconLink to="/dashboard" title="Go To Dashboard">
                <LayoutDashboardIcon className="size-6" />
              </IconLink>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
