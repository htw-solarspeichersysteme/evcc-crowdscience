import { createFileRoute } from "@tanstack/react-router";

import { H3, P, PageTitle } from "~/components/ui/typography";

export const Route = createFileRoute("/_public/impressum")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageTitle>Impressum</PageTitle>
      <H3>Herausgeber</H3>
      <P>
        Hochschule für Technik und Wirtschaft (HTW) <br />
        Berlin Fachbereich 2 - Ingenieurwissenschaften: Technik und Leben <br />
        Wilhelminenhofstraße 75A <br />
        12459 Berlin
      </P>

      <H3>Vertreten durch</H3>
      <P>Prof. Dr.-Ing. Volker Wohlgemuth</P>
      <H3>Verantwortlich für den Inhalt gemäß § 55 Abs. 2 RStV</H3>
      <P>
        Studierende des Fachbereichs 2 der HTW Berlin (nicht-kommerzielles
        Projekt).
      </P>
      <H3>Kontakt</H3>
      <P>
        Telefon: +49 30 5019-4393 <br />
        E-Mail:{" "}
        <a
          href="mailto:Volker.Wohlgemuth@HTW-Berlin.de"
          className="underline  hover:text-primary"
        >
          Volker.Wohlgemuth@HTW-Berlin.de
        </a>
      </P>
      <P>
        Bei technischen Anliegen:{" "}
        <a
          href="mailto:hey@lukasfrey.com"
          className="underline  hover:text-primary"
        >
          hey@lukasfrey.com
        </a>
      </P>
      <H3>Haftungsausschluss</H3>
      <P>
        Dieses Webangebot ist ein studentisches Prototyp-Projekt und dient
        ausschließlich zu Demonstrationszwecken im Rahmen eines universitären
        Lehrveranstaltungsprojekts. Für den Inhalt externer Links übernehmen wir
        keine Haftung. Für den Inhalt der verlinkten Seiten sind ausschließlich
        deren Betreiber verantwortlich.
      </P>
      <P>Impressumsangaben gemäß § 5 Telemediengesetz (TMG)</P>
    </>
  );
}
