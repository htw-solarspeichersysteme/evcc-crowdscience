import { Link } from "@tanstack/react-router";
import { ChartSplineIcon } from "lucide-react";

export function PublicSiteFooter() {
  return (
    <footer className="flex justify-end px-4 py-2 border-t">
      <nav className="flex gap-4  text-sm">
        <span className="text-sm">© {new Date().getFullYear()} Octopoda</span>
      </nav>
      <nav className="flex gap-4 ml-auto text-sm">
        <Link to="/">Imprint</Link>
        <Link to="/">Privacy</Link>
        <Link
          to="/dashboard"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ChartSplineIcon className="size-4" />
          Area for Researchers
        </Link>
      </nav>
    </footer>
  );
}
