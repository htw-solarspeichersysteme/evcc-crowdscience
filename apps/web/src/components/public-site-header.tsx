import { Link, type LinkProps } from "@tanstack/react-router";
import { GithubIcon, LayoutDashboardIcon, Rows3 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "~/auth";
import { Button } from "~/components/ui/button";
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
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language;

  const changeLang = (lng: string) => {
    console.log("changeLang called with", lng);
    void i18n
      .changeLanguage(lng)
      .then(() => {
        console.log(
          "i18n language now",
          i18n.resolvedLanguage ?? i18n.language,
        );
      })
      .catch((err) => console.error("i18n changeLanguage error", err));
    try {
      localStorage.setItem("i18nextLng", lng);
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-50 h-16 w-full shrink-0 border-b bg-background px-4 sm:px-6 lg:px-10">
      <div className="mx-auto flex size-full max-w-(--max-content-width) items-center">
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
            <div className="mr-2 flex items-center gap-2">
              <IconLink
                to="/view-data"
                title={t("nav.myData")}
                className="flex items-center gap-2"
              >
                <Rows3 className="size-6" />
                <span>{t("nav.myData")}</span>
              </IconLink>
            </div>

            <IconLink
              href="https://github.com/htw-solarspeichersysteme/evcc-crowdscience"
              title={t("nav.github")}
              target="_blank"
            >
              <GithubIcon className="size-6" />
            </IconLink>
            {session?.user ? (
              <IconLink to="/dashboard" title={t("nav.dashboard")}>
                <LayoutDashboardIcon className="size-6" />
              </IconLink>
            ) : null}

            {/* Language switch */}
            <div className="ml-4 flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 p-1">
              <Button
                type="button"
                onClick={() => {
                  changeLang("de");
                }}
                className={cn(
                  "h-8 rounded-md border px-2.5 text-sm font-medium transition-colors",
                  currentLanguage?.startsWith("de")
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/80 bg-background text-foreground/80 hover:bg-accent hover:text-accent-foreground",
                )}
                aria-label="Deutsch"
                title={t("lang.de")}
              >
                DE
              </Button>
              <Button
                type="button"
                onClick={() => {
                  changeLang("en");
                }}
                className={cn(
                  "h-8 rounded-md border px-2.5 text-sm font-medium transition-colors",
                  currentLanguage?.startsWith("en")
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/80 bg-background text-foreground/80 hover:bg-accent hover:text-accent-foreground",
                )}
                aria-label="English"
                title={t("lang.en")}
              >
                EN
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
