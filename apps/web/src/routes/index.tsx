import { type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";

import { DataFlowOverview } from "~/components/data-flow-overview";
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
import { H2, H3, P } from "~/components/ui/typography";
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
        "mx-auto w-full px-4 py-8 sm:px-6 md:py-16 lg:px-10",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-(--max-content-width) mx-auto w-full",
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

function Home() {
  return (
    <>
      <PublicSiteHeader />

      <div className="bg-background min-h-screen">
        {/* Hero Section */}
        <section className="bg-muted relative flex min-h-[calc(50svh-4rem)] items-center justify-center overflow-hidden px-4 py-16 sm:px-6 lg:px-10">
          <FlickeringGrid className="absolute h-full w-[calc(100svw+100px)]" />
          <div className="z-10 p-8">
            <div className="max-w-(--max-content-width) z-10 mx-auto w-full space-y-8">
              <div className="space-y-4 text-center">
                <h1 className="text-balance text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
                  Deine evcc Daten für die Energiewende
                </h1>
                <p className="text-muted-foreground mx-auto max-w-3xl text-balance text-lg sm:text-xl md:text-2xl">
                  Crowdscience-Projekt zur Erforschung dezentraler
                  Energiesysteme
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="group w-full sm:w-auto">
                  <Link to="/mitmachen">
                    Jetzt mitmachen
                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
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
                  HTW Berlin – Forschungsprojekt Wallboxinspektion
                </a>
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <a
                  href="https://github.com/htw-solarspeichersysteme/evcc-crowdscience"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Open Source
                </a>
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Link
                  to="/datenschutz"
                  title="Datenschutz"
                  target="_blank"
                  className="hover:underline"
                >
                  DSGVO-konform & pseudonymisiert
                </Link>
              </Badge>
            </div>
          </HomePageSection>

          {/* Motivation */}
          <HomePageSection id="motivation">
            <div className="mx-auto max-w-3xl space-y-6">
              <H2>Warum brauchen wir deine Daten?</H2>
              <P className="text-muted-foreground text-lg">
                In unserer Energieforschung von dezentralen Energiesystemen sind
                wir auf Zeitreihen-Daten angewiesen. Sie dienen als
                Eingangsdaten von Simulationen und helfen uns die Systeme und
                Interaktionen aus Solaranlage, Batterie, Elektroauto und/oder
                Wärmepumpen besser zu verstehen.
              </P>
              <P className="text-muted-foreground text-lg">
                Nur so können wir Lösungen entwickeln und technische
                Herausforderungen antizipieren, die wir für die Energiewende
                brauchen. Hinter unserer Arbeit steht dabei keine Firma und kein
                Profitinteresse sondern die Überzeugung, dass wir mit unserer
                Forschung die Energiewende unterstützen wollen.
              </P>
              <P className="text-muted-foreground text-lg">
                Das Problem: Es gibt aktuell keinen vergleichbaren offenen
                Datensatz mit realen Daten aus dezentralen Energiesystemen.
              </P>
            </div>
          </HomePageSection>

          <Separator className="max-w-(--max-content-width) mx-auto w-full" />

          {/* Das ist der Plan */}
          <HomePageSection id="plan">
            <div className="mx-auto max-w-3xl space-y-6">
              <H2>Das ist der Plan</H2>
              <P className="text-muted-foreground text-lg">
                Als Nutzende von evcc hantiert ihr täglich mit diesen für uns
                zentralen Daten. Wir möchten unsere Forschung und die Forschung
                anderer gerne mit eueren Datenspenden voranbringen.
              </P>
              <P className="text-muted-foreground text-lg">
                Hierfür wollen wir anonymisierte Daten eurer evcc aufzeichnen
                und als offenen Datensatz zur Verfügung stellen. Dies wäre ein
                einmaliger Datensatz, der je nach Anzahl an Teilnehmenden einen
                wichtigen Beitrag zur dezentralen Energiesystemforschung leisten
                kann.
              </P>
              <P className="text-muted-foreground text-lg">
                Wichtig ist uns: Neben einer wünschenswerten Detailtiefe des
                Datensatzes sollen durch strikte Anonymisierung keine Abstriche
                beim Datenschutz gemacht werden!
              </P>
            </div>
          </HomePageSection>

          <Separator className="max-w-(--max-content-width) mx-auto w-full" />

          {/* Mehrwert */}
          <HomePageSection id="mehrwert">
            <div className="mx-auto max-w-3xl space-y-6">
              <H2>Was ist der Mehrwert?</H2>

              <div className="space-y-4">
                <H3>Für die Forschung</H3>
                <P className="text-muted-foreground">
                  Ein einmaliger offener Datensatz mit realen Daten aus
                  dezentralen Energiesystemen, der reproduzierbare Analysen
                  ermöglicht und fundierte Entscheidungen jenseits von Marketing
                  unterstützt.
                </P>
              </div>

              <div className="space-y-4">
                <H3>Für die Community</H3>
                <P className="text-muted-foreground">
                  Auch ohne eigene InfluxDB die Möglichkeit der langfristigen
                  Speicherung von Zeitreihen mit Visualisierungen. Ein wichtiger
                  Mehrwert darüber hinaus sind geplante features, wie ein
                  Vergleich mit anderen Instanzen – aktuell nur unter Bekannten
                  möglich.
                </P>
              </div>
            </div>
          </HomePageSection>

          <Separator className="max-w-(--max-content-width) mx-auto w-full" />

          {/* Wie funktioniert's */}
          <HomePageSection id="so-funktionierts" className="bg-muted/30">
            <div className="mx-auto max-w-3xl space-y-6">
              <H2>Ablauf</H2>
              <P className="text-muted-foreground text-lg">
                Wir haben uns für eine Token-basierte Anmeldung und
                MQTT-Datenspende entschieden. Die Daten werden in InfluxDB
                gespeichert und sind auf der Webseite unter Angabe des Tokens
                für euch einsehbar.
              </P>
              <P className="text-muted-foreground text-lg">
                Alle Daten aus evcc, die persönliche Informationen enthalten
                könnten werden nicht gespeichert. Wer die Zuordnung des Tokens
                zu euch nicht kennt kann die Daten nicht zuordnen
                (Pseudonymisierung, die nur euch bekannt ist).
              </P>
              <P className="text-muted-foreground text-lg">
                Wenn ihr nicht mehr mitmachen wollt, beendet ihr die Datenspende
                einfach, indem ihr unseren MQTT Broker wieder aus evcc entfernt.
                Mitglieder der Forschungsgruppe haben die Möglichkeit, alle
                Instanzen zu betrachten und zu vergleichen.
              </P>
              <div className="mt-8 flex justify-center">
                <Button asChild size="lg" className="group">
                  <Link to="/mitmachen">
                    Zur Anleitung
                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </HomePageSection>

          <Separator className="max-w-(--max-content-width) mx-auto w-full" />

          {/* Datenschutz */}
          <HomePageSection id="datenschutz">
            <div className="mx-auto max-w-3xl space-y-6">
              <H2>Datenschutz & Anonymisierung</H2>
              <P className="text-muted-foreground text-lg">
                Deine Anonymität hat höchste Priorität:
              </P>
              <ul className="text-muted-foreground ml-6 list-disc space-y-2 text-lg">
                <li>
                  Keine Speicherung personenbezogener Informationen aus evcc
                </li>
                <li>
                  Pseudonymisierung per Token – ohne Kenntnis des Tokens keine
                  Zuordnung möglich
                </li>
                <li>Datenspende jederzeit in evcc deaktivierbar</li>
                <li>Keine IP-Adressen oder Standortdaten</li>
              </ul>
              <div className="mt-6">
                <Button asChild variant="outline">
                  <Link to="/datenschutz" target="_blank" title="Datenschutz">
                    Datenschutzerklärung lesen
                  </Link>
                </Button>
              </div>
            </div>
          </HomePageSection>

          <Separator className="max-w-(--max-content-width) mx-auto w-full" />

          {/* Quote from Research */}
          <HomePageSection className="bg-muted/30">
            <figure>
              <svg
                className="text-muted-foreground/50 mx-auto mb-6 h-12 w-12"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 18 14"
              >
                <path d="M6 0H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3H2a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3h-1a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Z" />
              </svg>
              <blockquote className="max-w-11/12 text-muted-foreground md:max-w-2/3 mx-auto text-balance text-center text-xl font-medium leading-8 md:text-2xl">
                "Im Forschungsprojekt{" "}
                <a
                  href="https://solar.htw-berlin.de/forschungsgruppe/wallbox-inspektion/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Wallboxinspektion
                </a>{" "}
                wollen wir besser verstehen, wie man gesteuertes Laden effizient
                gestaltet. Die evcc-Community hat den Mehrwert bereits erkannt
                und kann uns bereits heute zeigen, welche neuen Nutzungsmuster
                zu beachten sind."
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
                        Joseph Bergner
                      </a>
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm">
                      Wissenschaftlicher Mitarbeiter an der HTW Berlin
                    </div>
                  </div>
                </div>
              </figcaption>
            </figure>
          </HomePageSection>

          <Separator className="max-w-(--max-content-width) mx-auto w-full" />

          {/* FAQ */}
          <HomePageSection id="faq">
            <div className="mx-auto max-w-3xl space-y-6">
              <H2>Häufig gestellte Fragen</H2>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    Welche Daten werden gespeichert?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Es werden nur fachlich notwendige Zeitreihen gespeichert:
                    Ladeleistung, PV-Erzeugung, Batteriezustand,
                    Netzbezug/-einspeisung. Keine personenbezogenen
                    Informationen, keine IP-Adressen, keine Standortdaten.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    Wie funktioniert die Pseudonymisierung?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Die Daten werden durch einen Token pseudonymisiert, den nur
                    du kennst. Nur du kannst die Zuordnung zwischen Token und
                    deiner evcc-Instanz herstellen. Dies schützt deine
                    Privatsphäre optimal.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    Wie kann ich meine Daten einsehen?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Mit deinem Token kannst du unter{" "}
                    <Link
                      to="/view-data"
                      className="text-primary hover:underline"
                    >
                      Meine Daten
                    </Link>{" "}
                    jederzeit deine Visualisierungen ansehen und mit anderen
                    (anonymisierten) Instanzen vergleichen.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    Wer hat Zugriff auf die Daten?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Zugriff haben nur die Wissenschaftler*innen des
                    Forschungsprojekts{" "}
                    <a
                      href="https://solar.htw-berlin.de/forschungsgruppe/wallbox-inspektion/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Wallboxinspektion
                    </a>{" "}
                    an der HTW Berlin. Die Daten werden für wissenschaftliche
                    Zwecke genutzt.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    Wie lange läuft das Projekt?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Das Projekt läuft erstmal bis Ende 2025. Bei Anklang aus der
                    Community auch langfristig.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </HomePageSection>

          <Separator className="max-w-(--max-content-width) mx-auto w-full" />

          {/* Community Feedback */}
          <HomePageSection id="feedback" className="bg-muted/30">
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              <H2>Wir sind gespannt auf euer Feedback!</H2>
              <P className="text-muted-foreground text-lg">
                Dieses Projekt lebt von der Community. Teilt eure Wünsche,
                Vorschläge und Ideen mit uns – gemeinsam machen wir es besser!
              </P>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" variant="outline">
                  <a href="mailto:lukas.frey@htw-berlin.de">
                    Kontakt aufnehmen
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a
                    href="https://github.com/htw-solarspeichersysteme/evcc-crowdscience"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub Repository
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
              <H2 className="text-primary-foreground">Jetzt mitmachen!</H2>
              <P className="text-primary-foreground/90 text-lg">
                Gemeinsam schaffen wir einen einzigartigen Datensatz für die
                Energiewendeforschung. Deine Daten helfen, die Zukunft
                nachhaltiger Energiesysteme zu gestalten.
              </P>
              <Button asChild size="lg" variant="secondary" className="group">
                <Link to="/mitmachen">
                  Token holen & starten
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
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
