import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

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

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [activeSection, setActiveSection] = useState(0);

  const sections = [
    { id: 0, title: "Slogan" },
    {
      id: 1,
      title: "Wer sind Octopoda Analytics? und Was macht Octopoda Analytics? ",
    },
    { id: 2, title: "Was passiert mit den Daten" },
    { id: 3, title: "FAQS" },
  ];

  const handleScroll = () => {
    const sectionElements = document.querySelectorAll("section");
    let currentSection = 0;

    sectionElements.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      if (
        rect.top <= window.innerHeight / 2 &&
        rect.bottom >= window.innerHeight / 2
      ) {
        currentSection = index;
      }
    });

    setActiveSection(currentSection);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <PublicSiteHeader />
      <section
        id="0"
        // screen height minus header
        className="h-[calc(100svh-theme(spacing.16))] relative flex items-center justify-center bg-gray-100 p-6 overflow-hidden"
      >
        <FlickeringGrid className="h-full absolute w-[calc(100svw+100px)]" />
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-gray-900 text-center z-10 max-w-2xl lg:max-w-5xl">
          Spende Deine evcc Daten der Wissenschaft!
        </h1>
      </section>
      <main className="relative flex flex-1 grow flex-col max-w-full bg-background">
        {/* Scroll Indicator */}
        <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-50">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`w-4 h-4 rounded-full ${
                activeSection === section.id ? "bg-darkaccent" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
        <section
          id="1"
          className="flex flex-col gap-8 items-center justify-center bg-white-100 p-6"
        >
          <div className="max-w-2xl lg:max-w-5xl">
            <h2 className="text-2xl font-bold">Wer sind Octopoda Analytics?</h2>
            <p className="text-lg mt-4 text-justify">
              Das Projekt entstand als Teil eines Universitätsprojekts an der{" "}
              <a
                href="https://www.htw-berlin.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary
              hover:underline"
              >
                Hochschule für Technik und Wirtschaft (HTW)
              </a>{" "}
              Berlin im Rahmen des Studiengangs Umweltinformatik im
              Bachelorstudium. Ziel des Projekts war es, praxisnahes Wissen mit
              innovativen Technologien zu verbinden und eine Lösung zu
              entwickeln, die sowohl funktional als auch benutzerfreundlich ist.
              Das Team aus Studierenden arbeitete daran, komplexe Daten aus evcc
              zugänglicher zu machen, indem eine intuitive Schnittstelle
              geschaffen wurde. Diese Schnittstelle dient als Brücke zwischen
              den technischen Daten von evcc und deren Anwendungsfeldern in der
              wissenschaftlichen Forschung.
            </p>
          </div>
          <div className="w-full">
            <DataFlowOverview />
          </div>

          <div className="max-w-2xl lg:max-w-5xl">
            <h2 className="text-2xl font-bold">
              Was macht Octopoda Analytics?
            </h2>
            <p className="text-lg mt-4 text-justify">
              Mit Octopoda Analytics sollen Daten aus evcc für die öffentliche
              Forschung benutzerfreundlich analysiert und ausgewertet werden.
              Das Projekt stellt eine Schnittstelle bereit, zwischen evcc
              Community und den Wissenschaftler*innen. Diese ermöglicht es Daten
              aus dem evcc-System effizient zu analysieren und in ihren
              Forschungsarbeiten zu nutzen. Hierfür wurde eine intuitive und
              anonyme Datenspende Funktion auf Basis von{" "}
              <a
                href="https://www.hivemq.com/mqtt/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary
              hover:underline"
              >
                MQTT
              </a>{" "}
              realisiert. Somit lässt sich die evcc Community aktiv und
              barrierearm in die CrowdScience einbinden. Durch diese
              Schnittstelle wird der Zugang zu evcc-Daten erheblich erleichtert,
              was die Basis für fundierte Analysen und innovative Forschung
              bilden kann. Unsere Plattform transformiert komplexe Daten zu
              umsetzbaren Erkenntnissen.
            </p>
          </div>

          <div className="max-w-2xl lg:max-w-5xl items-center">
            <figure className="mx-auto text-justify">
              <svg
                className="w-8 h-8 mx-auto mb-3 text-black"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 18 14"
              >
                <path d="M6 0H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3H2a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3h-1a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Z" />
              </svg>
              <div className="flex items-center gap-4">
                <blockquote>
                  <p className="text-lg italic text-justify text-gray-900 dark:text-white">
                    "Im Forschungsprojekt{" "}
                    <a
                      href="https://solar.htw-berlin.de/forschungsgruppe/wallbox-inspektion/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary
                hover:underline"
                    >
                      Wallboxinspektion
                    </a>{" "}
                    wollen wir besser verstehen, wie man gesteuertes Laden
                    effizient gestaltet. Die evcc-Community hat den Mehrwert
                    bereits erkannt und kann uns bereits heute zeigen, welche
                    neuen Nutzungsmuster zu beachten sind. Ziel ist es Wallboxen
                    vergleichbar zu testen und zu bewerten um damit mehr
                    Transparenz am Markt zu schaffen."
                  </p>
                </blockquote>
                <img
                  className="w-22 h-20 rounded-full"
                  src="https://solar.htw-berlin.de/wp-content/uploads/portraet-joseph-bergner-768x512.jpg.webp"
                  alt="profile picture"
                />
              </div>

              <figcaption className=" flex  mt-6 space-x-3 rtl:space-x-reverse">
                <div className="flex text-left items-center divide-x-2 rtl:divide-x-reverse divide-gray-500">
                  <cite className="pe-3 font-medium text-gray-900 dark:text-white">
                    Joseph Bergner
                  </cite>
                  <cite className="ps-3 text-sm text-gray-500">
                    Wissenschaftlicher Mitarbeiter an der Hochschule für Technik
                    und Wirtschaft Berlin
                  </cite>
                </div>
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          id="2"
          className="flex flex-col items-center justify-center bg-gray-100 p-6 gap-8"
        >
          <div className="max-w-2xl text-left lg:max-w-5xl">
            <h2 className="text-2xl font-bold">
              Was passiert mit meinen Daten?
            </h2>
            <p className="text-lg mt-4 text-justify">
              Die von Dir bereitgestellten Daten werden ausschließlich für
              wissenschaftliche Zwecke genutzt. Sie dienen dazu, neue
              Erkenntnisse in Bereichen wie nachhaltige Mobilität,
              Solarenergienutzung und Energieeffizienz zu gewinnen. Dabei werden
              Deine Daten anonymisiert verarbeitet, um Deine Privatsphäre zu
              schützen. Durch Deine Unterstützung trägst Du dazu bei, Forschung
              und Entwicklung voranzutreiben und eine nachhaltigere Zukunft zu
              gestalten.
              <br /> Hilf uns dabei, fundierte Analysen zu erstellen und
              innovative Forschungsmöglichkeiten zu fördern!
            </p>
          </div>
          <Button asChild variant="default" className="w-44">
            <Link to="/contribute">Mach mit!</Link>
          </Button>
        </section>

        <section
          id="3"
          className="snap-start flex flex-col items-center justify-center p-6 bg-grey pb-16"
        >
          <h1 className="text-3xl font-bold mb-4 mt-4">FAQs</h1>
          <Accordion
            type="single"
            collapsible
            className="w-full max-w-2xl lg:max-w-5xl"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger className="flex items-center gap-2 py-4 font-medium">
                <div className="font-bold text-xl">
                  Wie kann ich meine Daten löschen?
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  Um Deine Daten zu löschen, wende Dich bitte per Email an einen
                  Admin unter{" "}
                  <a
                    href="mailto:admin@example.com"
                    className="text-primary hover:underline"
                  >
                    admin@example.com
                  </a>
                  .
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="flex items-center gap-2 py-4 font-medium">
                <div className="font-bold text-xl">
                  Sind meine Daten anonym?
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  Ja! Deine Daten werden durch eine ID pseudonymisiert, es
                  werden keine IP-Adressen oder andere personenbezogene Daten
                  gespeichert. Unter{" "}
                  <Link
                    to={"/view-data"}
                    className="text-primary hover:underline"
                  >
                    Meine Daten{" "}
                  </Link>{" "}
                  kannst Du jederzeit einsehen, über welche Daten wir verfügen.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="flex items-center gap-2 py-4 font-medium">
                <div className="font-bold text-xl">
                  Wofür werden meine Daten benutzt?
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  Deine evcc-Daten werden analysiert und ausgewertet um
                  Erkenntnisse in Bereichen wie nachhaltige Mobilität,
                  Solarenergienutzung und Energieeffizienz zu gewinnen.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="flex items-center gap-2 py-4 font-medium">
                <div className="font-bold text-xl">
                  Wer hat Zugriff auf meine Daten?
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  Zugriff auf Deine Daten haben nur die Wissenschaftler*innen
                  des Forschungsprojekt{" "}
                  <a
                    href="https://solar.htw-berlin.de/forschungsgruppe/wallbox-inspektion/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary
                hover:underline"
                  >
                    Wallboxinspektion
                  </a>
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </main>
      <PublicSiteFooter />
    </>
  );
}
