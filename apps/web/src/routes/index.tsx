import { type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PublicSiteFooter } from "~/components/public-site-footer";
import { PublicSiteHeader } from "~/components/public-site-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { FlickeringGrid } from "~/components/ui/flickering-grid";
import { Separator } from "~/components/ui/separator";
import { H2, P } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/")({
  component: Home,
});

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
    <section
      id={id}
      className={cn(
        `mx-auto w-full px-4 py-8 sm:px-6 md:py-16 lg:px-10`,
        className,
      )}
    >
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

function Home() {
  const { t } = useTranslation();

  return (
    <>
      <PublicSiteHeader />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative flex min-h-[calc(50svh-4rem)] items-center justify-center overflow-hidden bg-muted px-4 py-16 sm:px-6 lg:px-10">
          <FlickeringGrid className="absolute h-full w-[calc(100svw+100px)]" />
          <div className="z-10 p-8">
            <div className="z-10 mx-auto w-full max-w-(--max-content-width) space-y-8">
              <div className="space-y-4 text-center">
                <h1 className="text-4xl font-bold text-balance sm:text-5xl md:text-6xl lg:text-7xl">
                  {t("home.hero.title")}
                </h1>
                <p className="mx-auto max-w-3xl text-lg text-balance text-muted-foreground sm:text-xl md:text-2xl">
                  {t("home.hero.subtitle")}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="group w-full sm:w-auto">
                  <Link to="/mitmachen">
                    {t("home.hero.cta")}
                    <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <main className="flex flex-1 flex-col">
          {/* Trust Anchor */}
          <HomePageSection className="bg-muted/50">
            <div className="flex flex-wrap items-center justify-center gap-6 text-center">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <a
                  href="https://solar.htw-berlin.de/forschungsgruppe/wallbox-inspektion/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {t("home.trust.researchProject")}
                </a>
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <a
                  href="https://github.com/htw-solarspeichersysteme/evcc-crowdscience"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {t("home.trust.openSource")}
                </a>
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Link
                  to="/datenschutz"
                  title={t("home.trust.privacyTitle")}
                  target="_blank"
                  className="hover:underline"
                >
                  {t("home.trust.privacy")}
                </Link>
              </Badge>
            </div>
          </HomePageSection>

          {/* Warum */}
          <HomePageSection id="warum">
            <div className="mx-auto max-w-3xl space-y-6">
              <H2>{t("home.why.title")}</H2>
              {/* Add list */}
              <ul className="ml-6 list-disc space-y-2 text-lg text-muted-foreground">
                <li>{t("home.why.item1")}</li>
                <li>{t("home.why.item2")}</li>
                <li>{t("home.why.item3")}</li>
              </ul>
              <div className="mt-8 flex justify-center">
                <Link
                  to="/infos"
                  hash="motivation"
                  className="group inline-flex items-center gap-3 rounded-md px-2 py-1 text-lg font-semibold text-primary transition-colors hover:text-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label={t("home.why.moreInfo")}
                >
                  <span>{t("home.why.moreInfo")}</span>
                </Link>
              </div>
            </div>
          </HomePageSection>

          <Separator className="mx-auto w-full max-w-(--max-content-width)" />

          {/* Quote from Research */}
          <HomePageSection className="bg-muted/30">
            <figure>
              <svg
                className="mx-auto mb-6 size-12 text-muted-foreground/50"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 18 14"
              >
                <path d="M6 0H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3H2a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3h-1a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Z" />
              </svg>
              <blockquote className="mx-auto max-w-11/12 text-center text-xl/8 font-medium text-balance text-muted-foreground md:max-w-2/3 md:text-2xl">
                &quot;{t("home.quoteOne.text")}&quot;
              </blockquote>
              <figcaption className="mt-8">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="font-semibold">
                      <a
                        href="https://geers.tv"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {t("home.quoteOne.author")}
                      </a>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {t("home.quoteOne.role")}
                    </div>
                  </div>
                </div>
              </figcaption>
            </figure>
          </HomePageSection>

          <Separator className="mx-auto w-full max-w-(--max-content-width)" />

          {/* Was */}
          <HomePageSection id="was">
            <div className="mx-auto max-w-3xl space-y-6">
              <H2>{t("home.data.title")}</H2>
              {/* Add list */}
              <ul className="ml-6 list-disc space-y-2 text-lg text-muted-foreground">
                <li>{t("home.data.item1")}</li>
                <li>{t("home.data.item2")}</li>
                <li>{t("home.data.item3")}</li>
                <li>{t("home.data.item4")}</li>
              </ul>
              <div className="mt-8 flex justify-center">
                <Link
                  to="/infos"
                  hash="plan"
                  className="group inline-flex items-center gap-3 rounded-md px-2 py-1 text-lg font-semibold text-primary transition-colors hover:text-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label={t("home.data.moreInfo")}
                >
                  <span>{t("home.data.moreInfo")}</span>
                </Link>
              </div>
            </div>
          </HomePageSection>

          <Separator className="mx-auto w-full max-w-(--max-content-width)" />

          {/* Wie funktioniert's */}
          <HomePageSection id="so-funktionierts" className="bg-muted/30">
            <div className="mx-auto max-w-3xl space-y-6">
              <H2>{t("home.how.title")}</H2>
              <ul className="ml-6 list-decimal space-y-2 text-lg text-muted-foreground">
                <li>{t("home.how.step1")}</li>
                <li>{t("home.how.step2")}</li>
                <li>{t("home.how.step3")}</li>
              </ul>
              <div className="mt-8 flex justify-center">
                <Button asChild size="lg" className="group">
                  <Link to="/mitmachen">
                    {t("home.how.cta")}
                    <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
              <P className="text-lg text-muted-foreground">
                {t("home.how.infoPrefix")}{" "}
                <Link
                  to="/infos"
                  hash="ablauf"
                  className="text-primary hover:underline"
                >
                  {t("home.how.infoLink")}
                </Link>
                . <br />
                {t("home.how.infoSuffix")}
              </P>
            </div>
          </HomePageSection>

          <Separator className="mx-auto w-full max-w-(--max-content-width)" />

          {/* Quote from Research */}
          <HomePageSection className="bg-muted/30">
            <figure>
              <svg
                className="mx-auto mb-6 size-12 text-muted-foreground/50"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 18 14"
              >
                <path d="M6 0H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3H2a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3h-1a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Z" />
              </svg>
              <blockquote className="mx-auto max-w-11/12 text-center text-xl/8 font-medium text-balance text-muted-foreground md:max-w-2/3 md:text-2xl">
                &quot;{t("home.quoteTwo.text")}&quot;
              </blockquote>
              <figcaption className="mt-8">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="font-semibold">
                      <a
                        href="https://www.htw-berlin.de/hochschule/personen/person/?eid=9260"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {t("home.quoteTwo.author")}
                      </a>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {t("home.quoteTwo.role")}
                    </div>
                  </div>
                </div>
              </figcaption>
            </figure>
          </HomePageSection>

          <Separator className="mx-auto w-full max-w-(--max-content-width)" />

          {/* FAQ */}
          <HomePageSection id="faq">
            <div className="mx-auto max-w-3xl space-y-6">
              <H2>{t("home.faq.title")}</H2>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {t("home.faq.anonymousQuestion")}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t("home.faq.anonymousAnswer")}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {t("home.faq.durationQuestion")}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t("home.faq.durationAnswer")}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {t("home.faq.pseudonymizationQuestion")}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t("home.faq.pseudonymizationAnswer")}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {t("home.faq.storedDataQuestion")}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t("home.faq.storedDataAnswer")}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {t("home.faq.accessQuestion")}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t("home.faq.accessAnswerPrefix")} <br />
                    {t("home.faq.accessAnswerMiddle")}{" "}
                    <Link
                      to="/view-data"
                      className="text-primary hover:underline"
                    >
                      {t("nav.myData")}
                    </Link>{" "}
                    {t("home.faq.accessAnswerSuffix")}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-7">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {t("home.faq.resultsQuestion")}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t("home.faq.resultsAnswer")}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-8">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {t("home.faq.donateExistingQuestion")}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t("home.faq.donateExistingAnswer")}{" "}
                    <a
                      href="mailto:solar@htw-berlin.de"
                      className="text-primary hover:underline"
                    >
                      solar@htw-berlin.de
                    </a>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-9">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {t("home.faq.mqttBridgeQuestion")}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t("home.faq.mqttBridgeAnswer")}{" "}
                    <a
                      href="mailto:solar@htw-berlin.de"
                      className="text-primary hover:underline"
                    >
                      solar@htw-berlin.de
                    </a>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </HomePageSection>

          <Separator className="mx-auto w-full max-w-(--max-content-width)" />

          {/* Community Feedback */}
          <HomePageSection id="feedback" className="bg-muted/30">
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              <H2>{t("home.feedback.title")}</H2>
              <P className="text-lg text-muted-foreground">
                {t("home.feedback.description")}
              </P>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" variant="outline">
                  <a href="mailto:solar@htw-berlin.de">
                    {t("home.feedback.contact")}
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a
                    href="https://github.com/htw-solarspeichersysteme/evcc-crowdscience"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("home.feedback.github")}
                  </a>
                </Button>
              </div>
            </div>
          </HomePageSection>

          {/* Final CTA */}
          <HomePageSection
            id="mitmachen"
            className="bg-primary text-primary-foreground"
          >
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              <H2 className="text-primary-foreground">
                {t("home.finalCta.title")}
              </H2>
              <P className="text-lg text-primary-foreground/90">
                {t("home.finalCta.description")}
              </P>
              <Button asChild size="lg" variant="secondary" className="group">
                <Link to="/mitmachen">
                  {t("home.finalCta.button")}
                  <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </HomePageSection>
        </main>
      </div>
      <PublicSiteFooter />
    </>
  );
}
