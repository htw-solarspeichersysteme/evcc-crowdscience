import { Link } from "@tanstack/react-router";

export function PublicSiteFooter() {
  return (
    <footer className="flex justify-end px-4 py-2 border-t">
      <span className="text-sm">© {new Date().getFullYear()} Octopoda</span>
      <nav className="flex gap-4 ml-auto text-sm">
        <Link to="/">Imprint</Link>
        <Link to="/">Privacy</Link>
      </nav>
    </footer>
  );
}
