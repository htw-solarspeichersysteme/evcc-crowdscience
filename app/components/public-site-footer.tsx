import { Link } from "@tanstack/react-router";
import { ChartSplineIcon } from "lucide-react";

export function PublicSiteFooter() {
  return (
    <footer className="px-4 py-2 border-t">
      <div className="max-w-2xl lg:max-w-5xl mx-auto w-full h-full flex items-center">
        <nav className="flex gap-4  text-sm">
          <span className="text-sm">
            © {new Date().getFullYear()} Octopoda
          </span>
        </nav>
        <nav className="flex gap-4 ml-auto text-sm">
          <Link to="/">Impressum</Link>
          <Link to="/">Datenschutz</Link>
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ChartSplineIcon className="size-4" />
            Auswertungsbereich
          </Link>
        </nav>
      </div>
    </footer>
  );
}
