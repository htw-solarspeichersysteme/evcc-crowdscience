import { Link } from "@tanstack/react-router";
import { ChartSplineIcon } from "lucide-react";

export function PublicSiteFooter() {
  return (
    <footer className="border-t px-4 py-2 sm:px-6 lg:px-10">
      <div className="max-w-(--max-content-width) mx-auto flex h-full w-full items-center">
        <nav className="flex gap-4 text-sm">
          <span className="text-sm">
            © {new Date().getFullYear()} evcc-crowdscience
          </span>
        </nav>
        <nav className="ml-auto flex flex-wrap justify-end gap-x-4 gap-y-2 text-sm">
          <Link to="/impressum">Impressum</Link>
          <Link to="/datenschutz">Datenschutz</Link>
          <Link
            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            to="/dashboard"
          >
            <ChartSplineIcon className="size-4" />
            Auswertungsbereich
          </Link>
        </nav>
      </div>
    </footer>
  );
}
