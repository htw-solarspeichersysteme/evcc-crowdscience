import { type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { H2, H3, P } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

interface HomePageSectionProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  id?: string;
}

function HomePageSection({
  children,
  className,
  contentClassName,
  id,
}: HomePageSectionProps) {
  return (
    <section id={id} className={cn(`mx-auto w-full py-8 md:py-16`, className)}>
      <div
        className={cn(
          "mx-auto w-full max-w-(--max-content-width)",
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

export const Route = createFileRoute("/_public/infos")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();

  return (
    <>
      <main className="flex flex-1 flex-col">
        <HomePageSection
          id="hintergrund"
          className="scroll-mt-20 pt-0 md:pt-0 lg:pt-0"
        >
          <div className="mx-auto max-w-3xl space-y-6">
            <H2>{t("infos.background.title")}</H2>
            <P className="text-lg text-muted-foreground">
              {t("infos.background.p1")}
            </P>
            <P className="text-lg text-muted-foreground">
              {t("infos.background.p2")}
            </P>

            <H3>{t("infos.goal.title")}</H3>
            <P className="text-lg text-muted-foreground">
              {t("infos.goal.intro")}
            </P>
            <ul className="ml-6 list-disc space-y-2 text-lg text-muted-foreground">
              <li>{t("infos.goal.item1")}</li>
              <li>{t("infos.goal.item2")}</li>
              <li>{t("infos.goal.item3")}</li>
              <li>{t("infos.goal.item4")}</li>
              <li>{t("infos.goal.item5")}</li>
            </ul>

            <P className="text-lg text-muted-foreground">
              {t("infos.goal.outro")}
            </P>

            <H3>{t("infos.participation.title")}</H3>
            <P className="text-lg text-muted-foreground">
              {t("infos.participation.textPrefix")}{" "}
              <a
                href="https://evcc-crowdscience.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                https://evcc-crowdscience.de/
              </a>
              . {t("infos.participation.textSuffix")}
            </P>

            <H3>{t("infos.benefits.title")}</H3>
            <ul className="ml-6 list-disc space-y-2 text-lg text-muted-foreground">
              <li>{t("infos.benefits.item1")}</li>
              <li>{t("infos.benefits.item2")}</li>
              <li>{t("infos.benefits.item3")}</li>
              <li>{t("infos.benefits.item4")}</li>
            </ul>
          </div>
        </HomePageSection>

        <Separator className="mx-auto w-full max-w-(--max-content-width)" />

        {/* Motivation */}
        <HomePageSection id="motivation" className="scroll-mt-10">
          <div className="mx-auto max-w-3xl space-y-6">
            <H2>{t("infos.motivation.title")}</H2>
            <P className="text-lg text-muted-foreground">
              {t("infos.motivation.p1")}
            </P>
            <P className="text-lg text-muted-foreground">
              {t("infos.motivation.p2")}
            </P>
            <P className="text-lg text-muted-foreground">
              {t("infos.motivation.p3")}
            </P>
          </div>
        </HomePageSection>

        <Separator className="mx-auto w-full max-w-(--max-content-width)" />

        {/* Das ist der Plan */}
        <HomePageSection id="plan" className="scroll-mt-10">
          <div className="mx-auto max-w-3xl space-y-6">
            <H2>{t("infos.plan.title")}</H2>
            <P className="text-lg text-muted-foreground">
              {t("infos.plan.p1")}
            </P>
            <P className="text-lg text-muted-foreground">
              {t("infos.plan.p2")}
            </P>
            <P className="text-lg text-muted-foreground">
              {t("infos.plan.p3")}
            </P>
          </div>
        </HomePageSection>

        <Separator className="mx-auto w-full max-w-(--max-content-width)" />

        {/* Mehrwert */}
        <HomePageSection id="mehrwert" className="scroll-mt-10">
          <div className="mx-auto max-w-3xl space-y-6">
            <H2>{t("infos.addedValue.title")}</H2>

            <div className="space-y-4">
              <H3>{t("infos.addedValue.researchTitle")}</H3>
              <P className="text-muted-foreground">
                {t("infos.addedValue.researchText")}
              </P>
            </div>

            <div className="space-y-4">
              <H3>{t("infos.addedValue.communityTitle")}</H3>
              <P className="text-muted-foreground">
                {t("infos.addedValue.communityText")}
              </P>
            </div>
          </div>
        </HomePageSection>

        <Separator className="mx-auto w-full max-w-(--max-content-width)" />

        {/* Wie funktioniert's */}
        <HomePageSection id="ablauf" className="scroll-mt-10 bg-muted/30">
          <div className="mx-auto max-w-3xl space-y-6">
            <H2>{t("infos.procedure.title")}</H2>
            <P className="text-lg text-muted-foreground">
              {t("infos.procedure.p1")}
            </P>
            <P className="text-lg text-muted-foreground">
              {t("infos.procedure.p2")}
            </P>
            <P className="text-lg text-muted-foreground">
              {t("infos.procedure.p3")}
            </P>
            <div className="mt-8 flex justify-center">
              <Button asChild size="lg" className="group">
                <Link to="/mitmachen">
                  {t("infos.procedure.cta")}
                  <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </HomePageSection>

        <Separator className="mx-auto w-full max-w-(--max-content-width)" />

        {/* Datenschutz */}
        <HomePageSection id="datenschutz" className="scroll-mt-10">
          <div className="mx-auto max-w-3xl space-y-6">
            <H2>{t("infos.privacy.title")}</H2>
            <P className="text-lg text-muted-foreground">
              {t("infos.privacy.intro")}
            </P>
            <ul className="ml-6 list-disc space-y-2 text-lg text-muted-foreground">
              <li>{t("infos.privacy.item1")}</li>
              <li>{t("infos.privacy.item2")}</li>
              <li>{t("infos.privacy.item3")}</li>
              <li>{t("infos.privacy.item4")}</li>
            </ul>
            <div className="mt-6">
              <Button asChild variant="outline">
                <Link
                  to="/datenschutz"
                  target="_blank"
                  title={t("infos.privacy.policyTitle")}
                >
                  {t("infos.privacy.policyCta")}
                </Link>
              </Button>
            </div>
          </div>
        </HomePageSection>
      </main>
    </>
  );
}
