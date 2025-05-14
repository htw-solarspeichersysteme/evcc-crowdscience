import { Link } from "@tanstack/react-router";
import { ChartSplineIcon } from "lucide-react";

export function PublicSiteFooter() {
  return (
    <footer className="px-4 py-2 border-t sm:px-6 lg:px-10">
      <div className="max-w-(--max-content-width) mx-auto w-full h-full flex items-center">
        <nav className="flex gap-4 text-sm">
          <span className="text-sm">
            © {new Date().getFullYear()} Octopoda
          </span>
        </nav>
        <nav className="flex flex-wrap justify-end ml-auto text-sm gap-x-4 gap-y-2">
          <Link to="/impressum">Impressum</Link>
          <Link to="/privacy">Datenschutz</Link>
          <Link
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
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
