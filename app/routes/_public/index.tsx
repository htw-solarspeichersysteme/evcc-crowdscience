import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { DataFlowOverview } from "~/components/data-flow-overview";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { FlickeringGrid } from "~/components/ui/flickering-grid";

export const Route = createFileRoute("/_public/")({
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
        id="0"
        // screen height minus header
        className="h-[calc(100svh-theme(spacing.16))] relative flex items-center justify-center bg-gray-100 p-8"
      >
        <FlickeringGrid className="h-full absolute" />
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-gray-900 text-center z-10">
          Spende Deine evcc Daten der Wissenschaft!
        </h1>
      </section>

      <section
        id="1"
        className="flex flex-col gap-8 items-center justify-center bg-white-100 p-8"
      >
        <div className="max-w-2xl text-left lg:max-w-4xl">
          <h2 className="text-2xl font-bold">Wer sind Octopoda Analytics?</h2>
          <p className="text-lg mt-4">
            Das Projekt entstand als Teil eines Universitätsprojekts an der
            Hochschule für Technik und Wirtschaft (HTW) Berlin im Rahmen des
            Studiengangs Umweltinformatik im Bachelorstudium. Ziel des Projekts
            war es, praxisnahes Wissen mit innovativen Technologien zu verbinden
            und eine Lösung zu entwickeln, die sowohl funktional als auch
            benutzerfreundlich ist. Das Team aus Studierenden arbeitete daran,
            komplexe Daten aus evcc zugänglicher zu machen, indem eine intuitive
            Schnittstelle geschaffen wurde. Diese Schnittstelle dient als Brücke
            zwischen den technischen Daten von evcc und deren Anwendungsfeldern
            in der wissenschaftlichen Forschung.
          </p>
        </div>

        <div className="max-w-2xl text-right lg:max-w-4xl">
          <h2 className="text-2xl font-bold">Was macht Octopoda Analytics?</h2>
          <p className="text-lg mt-4">
            Das Projekt stellt eine Schnittstelle bereit, die es
            Wissenschaftler*innen ermöglicht, Daten aus dem evcc-System
            effizient zu analysieren und in ihren Forschungsarbeiten zu nutzen.
            Dabei liegt der Fokus auf der Bereitstellung einer
            benutzerfreundlichen und flexiblen Plattform, die komplexe
            technische Daten verständlich aufbereitet. Die Zielgruppe umfasst
            vor allem wissenschaftliche Institutionen und Forschende, die sich
            mit nachhaltiger Mobilität, Ladeinfrastruktur und Energieeffizienz
            befassen. Durch diese Schnittstelle wird der Zugang zu evcc-Daten
            erheblich erleichtert, was die Basis für fundierte Analysen und
            innovative Forschung bildet.
          </p>
        </div>
        <div className="w-full">
          <DataFlowOverview />
        </div>
      </section>

      <section
        id="2"
        className="flex flex-col items-center justify-center bg-gray-100 p-8 gap-8"
      >
        <div className="max-w-2xl text-left lg:max-w-4xl">
          <h2 className="text-2xl font-bold">Was passiert mit den Daten?</h2>
          <p className="text-lg mt-4 text-left">
            Die von Ihnen bereitgestellten Daten werden ausschließlich für
            wissenschaftliche Zwecke genutzt. Sie dienen dazu, neue Erkenntnisse
            in Bereichen wie nachhaltige Mobilität, Ladeinfrastruktur und
            Energieeffizienz zu gewinnen. Wissenschaftler*innen analysieren die
            Daten, um Muster zu erkennen, Prognosen zu erstellen und innovative
            Lösungen für aktuelle Herausforderungen zu entwickeln. Dabei werden
            Ihre Daten anonymisiert und gemäß höchsten Datenschutzstandards
            verarbeitet, um Ihre Privatsphäre zu schützen. Durch Ihre
            Unterstützung tragen Sie dazu bei, Forschung und Entwicklung
            voranzutreiben und eine nachhaltigere Zukunft zu gestalten.
          </p>
        </div>
        <Button asChild variant="default" className="w-44">
          <Link to="/contribute">Mach mit!</Link>
        </Button>
      </section>

      <section
        id="3"
        className="snap-start flex flex-col items-center justify-center p-8 bg-grey pb-16"
      >
        <h1 className="text-3xl font-bold mb-4 mt-4">FAQs</h1>
        <Accordion
          type="single"
          collapsible
          className="w-full max-w-2xl lg:max-w-4xl"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger className="flex items-center gap-2 py-4 font-medium">
              <div className="font-bold text-xl">
                Wie kann ich meine Daten löschen?
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p>
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                Voluptate temporibus recusandae reiciendis, sed officia
                consectetur nostrum et rem vel nihil quaerat magnam illum ea
                officiis ex. Quas ratione voluptatibus vitae!
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="flex items-center gap-2 py-4 font-medium">
              <div className="font-bold text-xl">Sind meine Daten anonym?</div>
            </AccordionTrigger>
            <AccordionContent>
              <p>
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                Voluptate temporibus recusandae reiciendis, sed officia
                consectetur nostrum et rem vel nihil quaerat magnam illum ea
                officiis ex. Quas ratione voluptatibus vitae!
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
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                Voluptate temporibus recusandae reiciendis, sed officia
                consectetur nostrum et rem vel nihil quaerat magnam illum ea
                officiis ex. Quas ratione voluptatibus vitae!
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
                Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                Voluptate temporibus recusandae reiciendis, sed officia
                consectetur nostrum et rem vel nihil quaerat magnam illum ea
                officiis ex. Quas ratione voluptatibus vitae!
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </>
  );
}
