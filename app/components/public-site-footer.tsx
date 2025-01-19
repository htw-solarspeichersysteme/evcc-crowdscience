import { Link } from "@tanstack/react-router";
import { ChartSplineIcon } from "lucide-react";

export function PublicSiteFooter() {
  return (
    <footer className="flex justify-end px-4 py-2 border-t">
      <nav className="flex gap-4  text-sm">
        <span className="text-sm">© {new Date().getFullYear()} Octopoda</span>
      </nav>
      <nav className="flex gap-4 ml-auto text-sm">
        <Link
          className="rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          to="/"
        >
          Impressum
        </Link>
        <Link
          className="rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          to="/"
        >
          Datenschutz
        </Link>
        <Link
          className=" flex items-center gap-1 text-muted-foreground hover:text-foreground rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          to="/dashboard"
        >
          <ChartSplineIcon className="size-4 rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          Auswertungsbereich
        </Link>
      </nav>
    </footer>
  );
}
