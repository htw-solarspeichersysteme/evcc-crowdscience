import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/impressum")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section
      id="1"
      className="flex flex-col gap-8 items-center justify-center bg-white-100"
    >
      <div className="max-w-2xl text-left lg:max-w-5xl">
        <h2 className="text-3xl font-bold">Impressum</h2>
        <h3 className="text-xl font-bold mt-6">Herausgeber</h3>
        <p className="text-lg mt-2">
          Hochschule für Technik und Wirtschaft (HTW) <br />
          Berlin Fachbereich 2 - Ingenieurwissenschaften: Technik und Leben{" "}
          <br />
          Wilhelminenhofstraße 75A <br />
          12459 Berlin
        </p>
        <h3 className="text-xl font-bold mt-8">Vertreten durch</h3>
        <p className="text-lg mt-2">Prof. Dr.-Ing. Volker Wohlgemuth</p>
        <h3 className="text-xl font-bold mt-8">
          Verantwortlich für den Inhalt gemäß § 55 Abs. 2 RStV
        </h3>
        <p className="text-lg mt-2">
          Studierende des Fachbereichs 2 der HTW Berlin (nicht-kommerzielles
          Projekt).
        </p>
        <h3 className="text-xl font-bold mt-8">Kontakt</h3>
        <p className="text-lg mt-2">
          Telefon: +49 30 5019-4393 <br />
          E-Mail:{" "}
          <a
            href="mailto:Volker.Wohlgemuth@HTW-Berlin.de"
            className=" hover:text-primary underline"
          >
            Volker.Wohlgemuth@HTW-Berlin.de
          </a>
        </p>
        <p className="text-lg mt-2">
          Bei technischen Anliegen:{" "}
          <a
            href="mailto:hey@lukasfrey.com"
            className=" hover:text-primary underline"
          >
            hey@lukasfrey.com
          </a>
        </p>
        <h3 className="text-xl font-bold mt-8">Haftungsausschluss</h3>
        <p className="text-lg mt-2">
          Dieses Webangebot ist ein studentisches Prototyp-Projekt und dient
          ausschließlich zu Demonstrationszwecken im Rahmen eines universitären
          Lehrveranstaltungsprojekts. Für den Inhalt externer Links übernehmen
          wir keine Haftung. Für den Inhalt der verlinkten Seiten sind
          ausschließlich deren Betreiber verantwortlich.
        </p>
        <p className="text-xs mt-10">
          {" "}
          Impressumsangaben gemäß § 5 Telemediengesetz (TMG)
        </p>
      </div>
    </section>
  );
}
