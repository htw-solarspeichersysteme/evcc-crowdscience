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
        <nav className="flex gap-x-4 gap-y-2 ml-auto text-sm flex-wrap justify-end">
          <Link
            className="rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            to="/impressum"
          >
            Impressum
          </Link>
          <Link
            className="rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            to="/privacy"
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
      </div>
    </footer>
  );
}
