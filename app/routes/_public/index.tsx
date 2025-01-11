import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

// import { useAuth } from "~/auth";
import { AnimatedBeam } from "~/components/ui/animated-beam";
import { Button } from "~/components/ui/button";
import { FlickeringGrid } from "~/components/ui/flickering-grid";

// import { PageTitle } from "~/components/ui/typography";

export const Route = createFileRoute("/_public/")({
  component: Home,
});

function Home() {
  // const { session } = useAuth();
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
    const scrollPosition = window.scrollY;
    const sectionHeight = window.innerHeight;
    const currentSection = Math.round(scrollPosition / sectionHeight);
    setActiveSection(currentSection);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="h-screen snap-y snap-mandatory overflow-y-scroll relative">
      {/* Scroll Indicator */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
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
        className="h-screen snap-start flex items-center justify-center bg-gray-100"
      >
        <FlickeringGrid>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-gray-900 text-center">
            Spende Deine evcc Daten der Wissenschaft!
          </h1>
        </FlickeringGrid>
      </section>

      <section
        id="1"
        className="h-screen snap-start flex flex-col items-center justify-center bg-white p-8"
      >
        <div className="max-w-2xl text-left">
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
        <div className="max-w-2xl text-right">
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
      </section>
      <section
        id="2"
        className="h-screen snap-start flex flex-col items-center justify-center bg-white p-8"
      >
        <div className="max-w-2xl text-center">
          <h2 className="text-2xl font-bold">Was passiert mit den Daten?</h2>
          <p className="text-lg mt-4">
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
        <div className="gap-4 mt-4">
          <Button asChild variant="default">
            <Link to="/contribute">Mach mit!</Link>
          </Button>
        </div>
      </section>

      <section
        id="3"
        className="h-screen snap-start flex flex-col items-center justify-center bg-white p-8"
      >
        <h1 className="text-3xl font-bold">FAQs</h1>
        <div className="text-left">
          <h2 className="text-2xl font-bold">
            Wie kann ich meine Daten löschen?{" "}
          </h2>
          <p>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Voluptate
            temporibus recusandae reiciendis, sed officia consectetur nostrum et
            rem vel nihil quaerat magnam illum ea officiis ex. Quas ratione
            voluptatibus vitae!
          </p>
          <hr className="my-4 border-t border-gray-300" />
          <h2 className="text-2xl font-bold">Sind meine Daten anonym? </h2>
          <p>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Voluptate
            temporibus recusandae reiciendis, sed officia consectetur nostrum et
            rem vel nihil quaerat magnam illum ea officiis ex. Quas ratione
            voluptatibus vitae!
          </p>
          <hr className="my-4 border-t border-gray-300" />
          <h2 className="text-2xl font-bold">
            Wofür werden meine Daten benutzt?{" "}
          </h2>
          <p>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Voluptate
            temporibus recusandae reiciendis, sed officia consectetur nostrum et
            rem vel nihil quaerat magnam illum ea officiis ex. Quas ratione
            voluptatibus vitae!
          </p>
          <hr className="my-4 border-t border-gray-300" />
          <h2 className="text-2xl font-bold">
            Wer hat Zugriff auf meine Daten?{" "}
          </h2>
          <p>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Voluptate
            temporibus recusandae reiciendis, sed officia consectetur nostrum et
            rem vel nihil quaerat magnam illum ea officiis ex. Quas ratione
            voluptatibus vitae!
          </p>
          <hr className="my-4 border-t border-gray-300" />
          <h2 className="text-2xl font-bold">
            Wofür werden meine Daten benutzt?{" "}
          </h2>
          <p>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Voluptate
            temporibus recusandae reiciendis, sed officia consectetur nostrum et
            rem vel nihil quaerat magnam illum ea officiis ex. Quas ratione
            voluptatibus vitae!
          </p>
          <hr className="my-4 border-t border-gray-300" />
        </div>
      </section>
    </div>
  );
}
