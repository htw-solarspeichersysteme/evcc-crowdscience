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
        Berlin Fachbereich 1 - Energie und Information <br />
        Wilhelminenhofstraße 75A <br />
        12459 Berlin
      </P>

      <H3>Vertreten durch</H3>
      <P>Prof. Dr.-Ing. habil. Volker Quaschning</P>
      <H3>Verantwortlich für den Inhalt gemäß § 55 Abs. 2 RStV</H3>
      <P>Forschungsgruppe Solarspeichersysteme</P>
      <a
        href="https://solar.htw-berlin.de/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-primary underline"
      >
        https://solar.htw-berlin.de/
      </a>
      <H3>Kontakt</H3>
      <P>
        E-Mail:{" "}
        <a
          href="mailto:lukas.frey@htw-berlin.de"
          className="hover:text-primary underline"
        >
          lukas.frey@htw-berlin.de
        </a>
      </P>
      <P>Impressumsangaben gemäß § 5 Telemediengesetz (TMG)</P>
    </>
  );
}
