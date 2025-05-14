import { createFileRoute } from "@tanstack/react-router";

import { H3, List, P, PageTitle } from "~/components/ui/typography";

export const Route = createFileRoute("/_public/privacy")({
  component: RouteComponent,
});

export function RouteComponent() {
  return (
    <>
      <PageTitle>Datenschutz</PageTitle>

      <H3>1. Allgemeine Hinweise</H3>
      <P>
        Wir nehmen den Schutz Ihrer Daten ernst. Die Verarbeitung Ihrer Daten
        erfolgt ausschließlich im Rahmen der gesetzlichen Bestimmungen der
        Datenschutz-Grundverordnung (DSGVO) sowie weiterer einschlägiger
        Datenschutzgesetze.
      </P>

      <H3>2. Verantwortliche Stelle</H3>
      <P>Verantwortlich für die Datenverarbeitung im Rahmen dieses Projekts:</P>
      <P>
        Hochschule für Technik und Wirtschaft Berlin
        <br />
        Fachbereich 2 - Ingenieurwissenschaften: Technik und Leben
        <br />
        Wilhelminenhofstraße 75A
        <br />
        12459 Berlin
      </P>
      <P>
        Vertreten durch:
        <br />
        Prof. Dr.-Ing. Volker Wohlgemuth
        <br />
        Telefon: +49 30 5019-4393
        <br />
        E-Mail:{" "}
        <a
          href="mailto:Volker.Wohlgemuth@HTW-Berlin.de"
          className="hover:text-primary underline"
        >
          Volker.Wohlgemuth@HTW-Berlin.de
        </a>
      </P>

      <H3>3. Verarbeitete Daten</H3>
      <P>
        Im Rahmen des Projekts werden ausschließlich anonymisierte oder
        pseudonymisierte Daten verarbeitet, die von Nutzer*innen freiwillig über
        die Datenspende-Funktion bereitgestellt werden. Pseudonymisierte Daten
        enthalten eine Octopoda-ID, die in einem MQTT-Thema verwendet wird, um
        die Daten zu kennzeichnen. Diese ID stellt sicher, dass die Daten zwar
        einer Instanz zugeordnet sind, jedoch{" "}
        <span className="underline">
          keine Rückschlüsse auf einzelne Person möglich sind
        </span>
        . Es werden keine personenbezogenen Daten erhoben oder gespeichert.
        Insbesondere speichern wir keine IP-Adressen oder andere direkte
        Identifikatoren.
      </P>
      <P>
        Anonymisierte Daten können nicht auf einzelne Personen zurückgeführt
        werden und dienen ausschließlich der wissenschaftlichen Forschung.
      </P>
      <P>
        <span className="font-bold">Verarbeitete Daten können beinhalten:</span>
      </P>
      <List>
        <li>
          Technische Daten, die von einer Wallbox oder dem evcc-System generiert
          werden (z. B. Ladezeiten, Energieverbrauch, Ladeleistung).
        </li>
        <li>
          Metadaten, die zur Analyse beitragen (z. B. Zeitstempel, Geodaten auf
          aggregierter Ebene).
        </li>
      </List>

      <P>
        <span className="font-bold">Hinweis zu benutzergenerierten Daten:</span>
      </P>
      <P>
        Einige Daten im evcc-System, können von den Nutzenden selbst vergeben
        werden und könnten persönliche Informationen enthalten. Wir möchten Sie
        darauf hinweisen, dass Sie in diesen Feldern keine persönlichen Daten
        eingeben sollten. Solche Angaben werden anonymisiert verarbeitet, aber
        wir empfehlen, keine sensiblen oder identifizierenden Informationen zu
        verwenden, um Ihre Privatsphäre zu schützen.
      </P>

      <P>
        <span className="font-bold">Wichtig:</span>
        <br />
        Es werden keine personenbezogenen Daten erhoben oder gespeichert.
      </P>
      <P>
        Alle Daten werden vor der Verarbeitung anonymisiert oder
        pseudonymisiert, sodass ein Rückschluss auf Ihre Person ausgeschlossen
        ist.
      </P>

      <H3>4. Zwecke der Datenverarbeitung</H3>
      <P>
        Die anonymisierten Daten werden ausschließlich für wissenschaftliche
        Zwecke genutzt, insbesondere für:
      </P>
      <List>
        <li>
          Forschung im Bereich nachhaltiger Mobilität, Solarenergienutzung und
          Energieeffizienz.
        </li>
        <li>
          Entwicklung und Verbesserung von Technologien zur Steuerung und
          Optimierung von Ladevorgängen.
        </li>
      </List>

      <H3>5. Rechtsgrundlage der DatenVerarbeitung</H3>
      <P>
        Die Verarbeitung der Daten erfolgt auf Grundlage von Artikel 6 Abs. 1
        lit. a DSGVO (Einwilligung).
      </P>

      <H3>6. Speicherdauer</H3>
      <P>
        Die Daten werden für die Dauer des Projekts gespeichert. Nach Abschluss
        des Projekts werden alle Daten gelöscht, sofern keine gesetzlichen
        Aufbewahrungspflichten bestehen.
      </P>

      <H3>7. Weitergabe von Daten</H3>
      <P>
        Die Daten werden nicht an Dritte weitergegeben. Es erfolgt{" "}
        <span className="underline">keine kommerzielle Nutzung</span> der Daten.
      </P>

      <H3>8. Volle Transparenz</H3>
      <P>
        Wir bieten allen Nutzenden das gleiche Dashboard, um vollständige
        Transparenz über die gesammelten Daten zu gewährleisten. Auf diesem
        Dashboard können einzelne Personen jederzeit die von Ihnen gespendeten
        und anonymisierten Daten einsehen und die Analyseergebnisse überprüfen.
      </P>

      <H3>9. Ihre Rechte</H3>
      <P>
        Sie haben folgende Rechte in Bezug auf die Verarbeitung Ihrer Daten:
      </P>
      <List>
        <li>
          <span className="font-bold">Recht auf Auskunft</span>: Sie können
          jederzeit Auskunft über die gespeicherten Daten verlangen.
        </li>
        <li>
          <span className="font-bold">Recht auf Löschung</span>: Sie können
          verlangen, dass Ihre Daten gelöscht werden, sofern keine gesetzlichen
          Aufbewahrungspflichten entgegenstehen.
        </li>
        <li>
          <span className="font-bold">
            Recht auf Einschränkung der Verarbeitung
          </span>
          : Sie können die Einschränkung der Datenverarbeitung verlangen.
        </li>
        <li>
          <span className="font-bold">Recht auf Widerruf</span>: Sie können Ihre
          Einwilligung zur Verarbeitung jederzeit widerrufen.
        </li>
      </List>
      <P>
        Zur Ausübung Ihrer Rechte können Sie uns unter den oben angegebenen
        Kontaktdaten erreichen.
      </P>

      <H3>10. Änderungen der Datenschutzrichtlinie</H3>
      <P>
        Wir behalten uns vor, diese Datenschutzrichtlinie bei Bedarf anzupassen,
        um aktuellen rechtlichen Anforderungen zu entsprechen oder Änderungen im
        Projektablauf zu berücksichtigen.
      </P>
    </>
  );
}
