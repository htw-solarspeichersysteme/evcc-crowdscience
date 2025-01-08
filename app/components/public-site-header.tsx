import { Link } from "@tanstack/react-router";
import { GithubIcon, LayoutDashboardIcon, RatIcon } from "lucide-react";

import { Button } from "./ui/button";

export function PublicSiteHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center w-full h-16 px-4 border-b shrink-0 bg-background">
      <Link to="/" className="flex items-center gap-2 mr-6">
        <RatIcon className="size-6" />
        <span className="hidden text-lg font-semibold lg:inline-block">
          Octopoda
        </span>
      </Link>

      <div className="flex items-center justify-end flex-1 gap-2">
        <nav className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="px-0 -mr-1 size-7"
            asChild
          >
            <a
              href="https://github.com/kasulio/octopoda"
              target="_blank"
              rel="noreferrer"
              title="Go To GitHub"
            >
              <GithubIcon className="size-4" />
              <span className="sr-only">GitHub</span>
            </a>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="px-0 -mr-1 size-7"
          >
            <Link to="/dashboard" title="Go To Dashboard">
              <LayoutDashboardIcon className="size-4" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
