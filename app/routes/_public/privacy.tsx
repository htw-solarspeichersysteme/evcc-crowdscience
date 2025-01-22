import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/privacy")({
  component: RouteComponent,
});

export function RouteComponent() {
  return (
    <section
      id="1"
      className="flex flex-col gap-8 items-center justify-center bg-background"
    >
      <div className="max-w-2xl text-left lg:max-w-5xl">
        <h2 className="text-3xl font-bold">Datenschutz</h2>
        <h3 className="text-xl font-bold mt-8">1. Allgemeine Hinweise</h3>
        <p className="text-lg mt-2">
          Wir nehmen den Schutz Ihrer Daten ernst. Die Verarbeitung Ihrer Daten
          erfolgt ausschließlich im Rahmen der gesetzlichen Bestimmungen der
          Datenschutz-Grundverordnung (DSGVO) sowie weiterer einschlägiger
          Datenschutzgesetze.
        </p>
        <h3 className="text-xl font-bold mt-6">2. Verantwortliche Stelle</h3>
        <p className="text-lg mt-2">
          Verantwortlich für die Datenverarbeitung im Rahmen dieses Projekts:{" "}
          <br />
          Hochschule für Technik und Wirtschaft Berlin <br />
          Fachbereich 2 - Ingenieurwissenschaften: Technik und Leben <br />
          Wilhelminenhofstraße 75A <br />
          12459 Berlin <br />
          <br />
          Vertreten durch: <br />
          Prof. Dr.-Ing. Volker Wohlgemuth <br />
          Telefon: +49 30 5019-4393 <br />
          E-Mail:{" "}
          <a
            href="mailto:Volker.Wohlgemuth@HTW-Berlin.de"
            className=" hover:text-primary underline"
          >
            Volker.Wohlgemuth@HTW-Berlin.de
          </a>
        </p>
        <h3 className="text-xl font-bold mt-8">3. Verarbeitete Daten</h3>
        <p className="text-lg mt-2">
          Im Rahmen des Projekts werden ausschließlich anonymisierte oder
          pseudonymisierte Daten verarbeitet, die von Nutzer*innen freiwillig
          über die Datenspende-Funktion bereitgestellt werden. Pseudonymisierte
          Daten enthalten eine Octopoda-ID, die in einem MQTT-Thema verwendet
          wird, um die Daten zu kennzeichnen. Diese ID stellt sicher, dass die
          Daten zwar einer Instanz zugeordnet sind, jedoch{" "}
          <span className="underline">
            keine Rückschlüsse auf einzelne Person möglich sind
          </span>
          . Es werden keine personenbezogenen Daten erhoben oder gespeichert.
          Insbesondere speichern wir keine IP-Adressen oder andere direkte
          Identifikatoren. <br />
          <br />
          Anonymisierte Daten können nicht auf einzelne Personen zurückgeführt
          werden und dienen ausschließlich der wissenschaftlichen Forschung.
          <br />
          <br />
          <span className="font-bold underline">
            Verarbeitete Daten können beinhalten:
          </span>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Technische Daten, die von einer Wallbox oder dem evcc-System
              generiert werden (z. B. Ladezeiten, Energieverbrauch,
              Ladeleistung).
            </li>
            <li>
              Metadaten, die zur Analyse beitragen (z. B. Zeitstempel, Geodaten
              auf aggregierter Ebene).
            </li>
          </ol>{" "}
          <br />
          <span className="font-bold underline">
            Hinweis zu benutzergenerierten Daten:
          </span>{" "}
          <br />
          Einige Daten im evcc-System, können von den Nutzenden selbst vergeben
          werden und könnten persönliche Informationen enthalten. Wir möchten
          Sie darauf hinweisen, dass Sie in diesen Feldern keine persönlichen
          Daten eingeben sollten. Solche Angaben werden anonymisiert
          verarbeitet, aber wir empfehlen, keine sensiblen oder
          identifizierenden Informationen zu verwenden, um Ihre Privatsphäre zu
          schützen. <br /> <br />
          <span className="font-bold underline">Wichtig:</span> <br /> Es werden
          keine personenbezogenen Daten erhoben oder gespeichert. <br /> <br />
          Alle Daten werden vor der Verarbeitung anonymisiert oder
          pseudonymisiert, sodass ein Rückschluss auf Ihre Person ausgeschlossen
          ist.
          <br />
        </p>
        <h3 className="text-xl font-bold mt-8">
          4. Zwecke der Datenverarbeitung
        </h3>
        <p className="text-lg mt-2">
          Die anonymisierten Daten werden ausschließlich für wissenschaftliche
          Zwecke genutzt, insbesondere für:
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Forschung im Bereich nachhaltiger Mobilität, Solarenergienutzung
              und Energieeffizienz.
            </li>
            <li>
              Entwicklung und Verbesserung von Technologien zur Steuerung und
              Optimierung von Ladevorgängen.
            </li>
          </ol>{" "}
        </p>
        <h3 className="text-xl font-bold mt-8">
          5. Rechtsgrundlage der Datenverarbeitung
        </h3>
        <p className="text-lg mt-2">
          Die Verarbeitung der Daten erfolgt auf Grundlage von Artikel 6 Abs. 1
          lit. a DSGVO (Einwilligung).
        </p>
        <h3 className="text-xl font-bold mt-8">6. Speicherdauer</h3>
        <p className="text-lg mt-2">
          Die Daten werden für die Dauer des Projekts gespeichert. Nach
          Abschluss des Projekts werden alle Daten gelöscht, sofern keine
          gesetzlichen Aufbewahrungspflichten bestehen.
        </p>
        <h3 className="text-xl font-bold mt-8">7. Weitergabe von Daten</h3>
        <p className="text-lg mt-2">
          Die Daten werden nicht an Dritte weitergegeben. Es erfolgt{" "}
          <span className="underline">keine kommerzielle Nutzung</span> der
          Daten.
        </p>
        <h3 className="text-xl font-bold mt-8">8. Volle Transparenz</h3>
        <p className="text-lg mt-2">
          Wir bieten allen Nutzenden das gleiche Dashboard, um vollständige
          Transparenz über die gesammelten Daten zu gewährleisten. Auf diesem
          Dashboard können einzelne Personen jederzeit die von Ihnen gespendeten
          und anonymisierten Daten einsehen und die Analyseergebnisse
          überprüfen.
        </p>
        <h3 className="text-xl font-bold mt-8">9. Ihre Rechte</h3>
        <p className="text-lg mt-2">
          Sie haben folgende Rechte in Bezug auf die Verarbeitung Ihrer Daten:
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              <span className="font-bold underline">Recht auf Auskunft</span>:
              Sie können jederzeit Auskunft über die gespeicherten Daten
              verlangen.
            </li>
            <li>
              <span className="font-bold underline"> Recht auf Löschung</span>:
              Sie können verlangen, dass Ihre Daten gelöscht werden, sofern
              keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </li>
            <li>
              <span className="font-bold underline">
                Recht auf Einschränkung der Verarbeitung
              </span>
              : Sie können die Einschränkung der Datenverarbeitung verlangen.
            </li>
            <li>
              <span className="font-bold underline">Recht auf Widerruf</span>:
              Sie können Ihre Einwilligung zur Verarbeitung jederzeit
              widerrufen.
            </li>
          </ol>{" "}
          <br />
          Zur Ausübung Ihrer Rechte können Sie uns unter den oben angegebenen
          Kontaktdaten erreichen.
        </p>
        <h3 className="text-xl font-bold mt-8">
          10. Änderungen der Datenschutzrichtlinie
        </h3>
        <p className="text-lg mt-2">
          Wir behalten uns vor, diese Datenschutzrichtlinie bei Bedarf
          anzupassen, um aktuellen rechtlichen Anforderungen zu entsprechen oder
          Änderungen im Projektablauf zu berücksichtigen.
        </p>
      </div>
    </section>
  );
}
