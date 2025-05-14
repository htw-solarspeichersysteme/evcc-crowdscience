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
  fullWidth?: boolean;
}

function HomePageSection({
  children,
  className,
  contentClassName,
}: HomePageSectionProps) {
  return (
    <section className={cn("mx-auto w-full py-16 px-6 lg:px-10", className)}>
      <div
        className={cn(
          "mx-auto max-w-(--max-content-width) w-full",
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

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative flex h-[calc(100svh-4rem)] items-center justify-center overflow-hidden bg-muted px-6 lg:px-10">
          <FlickeringGrid className="absolute h-full w-[calc(100svw+100px)]" />
          <div className="mx-auto max-w-(--max-content-width) w-full z-10 ">
            <h1 className="text-6xl font-bold text-center text-gray-900  md:text-7xl lg:text-8xl">
              Spende deine evcc Daten der Wissenschaft!
            </h1>
          </div>
        </section>

        <main className="flex flex-col flex-1">
          {/* Wer sind Octopoda Analytics */}
          <HomePageSection>
            <div className="space-y-6">
              <H2>Wer sind Octopoda Analytics?</H2>
              <P className="text-lg text-muted-foreground">
                Das Projekt entstand als Teil eines Universitätsprojekts an der{" "}
                <a
                  href="https://www.htw-berlin.de/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Hochschule für Technik und Wirtschaft (HTW)
                </a>{" "}
                Berlin im Rahmen des Studiengangs Umweltinformatik im
                Bachelorstudium. Ziel des Projekts war es, praxisnahes Wissen
                mit innovativen Technologien zu verbinden und eine Lösung zu
                entwickeln, die sowohl funktional als auch benutzerfreundlich
                ist.
              </P>
              <P>
                Das Team aus Studierenden arbeitete daran, komplexe Daten aus
                evcc zugänglicher zu machen, indem eine intuitive Schnittstelle
                geschaffen wurde. Diese Schnittstelle dient als Brücke zwischen
                den technischen Daten von evcc und deren Anwendungsfeldern in
                der wissenschaftlichen Forschung.
              </P>
            </div>
          </HomePageSection>

          {/* Data Flow Overview */}
          <HomePageSection className="py-8">
            <div className="max-w-(--max-content-width) mx-auto">
              <DataFlowOverview className="p-4 -m-4 w-[calc(100%+(--spacing(8)))]" />
            </div>
          </HomePageSection>

          {/* Was macht Octopoda Analytics */}
          <HomePageSection>
            <div className="space-y-6">
              <H2>Was macht Octopoda Analytics?</H2>
              <P className="text-lg text-muted-foreground">
                Mit Octopoda Analytics sollen Daten aus evcc für die öffentliche
                Forschung benutzerfreundlich analysiert und ausgewertet werden.
                Das Projekt stellt eine Schnittstelle bereit, zwischen evcc
                Community und den Wissenschaftler*innen. Diese ermöglicht es
                Daten aus dem evcc-System effizient zu analysieren und in ihren
                Forschungsarbeiten zu nutzen. Hierfür wurde eine intuitive und
                anonyme Datenspende Funktion auf Basis von{" "}
                <a
                  href="https://www.hivemq.com/mqtt/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  MQTT
                </a>{" "}
                realisiert.
              </P>
            </div>
          </HomePageSection>

          <Separator className="mx-auto w-full max-w-(--max-content-width)" />

          {/* Quote */}
          <HomePageSection>
            <figure>
              <svg
                className="w-12 h-12 mx-auto mb-6 text-muted-foreground/50"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 18 14"
              >
                <path d="M6 0H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3H2a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3h-1a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Z" />
              </svg>
              <blockquote className="mx-auto text-xl font-medium leading-8 text-center text-muted-foreground md:text-2xl text-balance max-w-2/3">
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
                    <div className="mt-1 text-sm text-muted-foreground">
                      Wissenschaftlicher Mitarbeiter an der HTW Berlin
                    </div>
                  </div>
                </div>
              </figcaption>
            </figure>
          </HomePageSection>

          <Separator className="mx-auto w-full max-w-(--max-content-width)" />

          {/* Was passiert mit meinen Daten */}
          <HomePageSection>
            <div className="space-y-6">
              <H2>Was passiert mit meinen Daten?</H2>
              <P className="text-lg text-muted-foreground">
                Die von Dir bereitgestellten Daten werden ausschließlich für
                wissenschaftliche Zwecke genutzt. Sie dienen dazu, neue
                Erkenntnisse in Bereichen wie nachhaltige Mobilität,
                Solarenergienutzung und Energieeffizienz zu gewinnen. Dabei
                werden Deine Daten anonymisiert verarbeitet, um deine
                Privatsphäre zu schützen.
              </P>

              <p className="mt-10 text-lg font-medium">
                Hilf uns dabei, fundierte Analysen zu erstellen und innovative
                Forschungsmöglichkeiten zu fördern!
              </p>
              <Button asChild size="lg" className="w-full group">
                <Link to="/contribute">
                  Mitmachen
                  <ArrowRightIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </HomePageSection>

          <Separator className="mx-auto w-full max-w-(--max-content-width)" />

          {/* FAQ */}
          <HomePageSection className="space-y-8">
            <div className="space-y-6">
              <H2>Häufig gestellte Fragen</H2>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-xl font-semibold">
                    Wie kann ich meine Daten löschen?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Um deine Daten zu löschen, wende dich bitte per Email an{" "}
                    <a
                      href="mailto:hey@lukasfrey.com"
                      className="text-primary hover:underline"
                    >
                      hey@lukasfrey.com
                    </a>
                    .
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-xl font-semibold">
                    Sind meine Daten anonym?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Ja! Deine Daten werden durch eine ID pseudonymisiert, es
                    werden keine IP-Adressen oder andere personenbezogene Daten
                    gespeichert. Unter{" "}
                    <Link
                      to={"/view-data"}
                      className="text-primary hover:underline"
                    >
                      Meine Daten
                    </Link>{" "}
                    kannst du jederzeit einsehen, über welche Daten wir
                    verfügen.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-xl font-semibold">
                    Wofür werden meine Daten benutzt?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Deine evcc-Daten werden analysiert und ausgewertet um
                    Erkenntnisse in Bereichen wie nachhaltige Mobilität,
                    Solarenergienutzung und Energieeffizienz zu gewinnen.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-xl font-semibold">
                    Wer hat Zugriff auf meine Daten?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Zugriff auf deine Daten haben nur die Wissenschaftler*innen
                    des Forschungsprojekt{" "}
                    <a
                      href="https://solar.htw-berlin.de/forschungsgruppe/wallbox-inspektion/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Wallboxinspektion
                    </a>
                    .
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </HomePageSection>
        </main>
      </div>
      <PublicSiteFooter />
    </>
  );
}
