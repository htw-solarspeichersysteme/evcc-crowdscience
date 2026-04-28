import { Link } from "@tanstack/react-router";
import { ChartSplineIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function PublicSiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t px-4 py-2 sm:px-6 lg:px-10">
      <div className="mx-auto flex size-full max-w-(--max-content-width) items-center">
        <nav className="flex gap-4 text-sm">
          <span className="text-sm">
            © {new Date().getFullYear()} evcc-crowdscience
          </span>
        </nav>
        <nav className="ml-auto flex flex-wrap justify-end gap-x-4 gap-y-2 text-sm">
          <Link to="/impressum">{t("footer.imprint")}</Link>
          <Link to="/datenschutz">{t("footer.privacy")}</Link>
          <Link
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            to="/dashboard"
          >
            <ChartSplineIcon className="size-4" />
            {t("footer.analytics")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
