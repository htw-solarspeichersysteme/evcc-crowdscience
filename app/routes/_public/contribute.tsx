import { AccordionHeader, AccordionTrigger } from "@radix-ui/react-accordion";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { format } from "date-fns";
import { PartyPopperIcon } from "lucide-react";
import Confetti from "react-confetti-boom";
import { z } from "zod";

import mqttInstruction1 from "~/assets/instructions/mqtt-instruction-1.png";
import mqttInstruction2 from "~/assets/instructions/mqtt-instruction-2.png";
import mqttInstruction3 from "~/assets/instructions/mqtt-instruction-3.png";
import mqttInstruction4 from "~/assets/instructions/mqtt-instruction-4.png";
import { CopyableText } from "~/components/copyable-text";
import { MiniInstructionGallery } from "~/components/mini-instruction-gallery";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "~/components/ui/accordion";
import { Button, LoadingButton } from "~/components/ui/button";
import { H3, PageTitle } from "~/components/ui/typography";
import { cn } from "~/lib/utils";
import { instanceApi } from "~/serverHandlers/instance";

export const Route = createFileRoute("/_public/contribute")({
  component: RouteComponent,
  validateSearch: zodValidator({
    schema: z.object({
      instanceId: z.string().optional(),
      step: z.number().optional().default(1),
    }),
  }),
  beforeLoad: ({ search }) => {
    if (search.step === 1 && search.instanceId) {
      throw redirect({
        to: ".",
        search: (prev) => ({ ...prev, step: 2 }),
      });
    }
  },
});

function StepItem({
  step,
  activeStep,
  title,
  children,
  className,
}: {
  step: number;
  activeStep: number;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AccordionItem value={`step-${step}`}>
      <AccordionHeader className="flex">
        <AccordionTrigger className="flex items-center gap-2 py-4 font-medium transition-all cursor-default">
          <div
            className={cn(
              "flex size-6 items-center justify-center rounded-full transition-colors",
              step <= activeStep && "bg-primary text-primary-foreground",
            )}
          >
            {step}
          </div>
          <span className="">{title}</span>
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent className={cn("flex flex-col gap-2", className)}>
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { instanceId, step } = Route.useSearch();
  const generateInstanceIdMutation =
    instanceApi.generateInstanceId.useMutation();

  const latestInstanceUpdate = instanceApi.getLatestInstanceUpdate.useQuery({
    variables: { data: { instanceId: instanceId!, hasToBeRecent: true } },
    enabled: !!instanceId && step > 2,
    refetchInterval: 10000,
  });

  return (
    <div className="p-4 grow flex flex-col">
      {latestInstanceUpdate.data ? (
        <div className="motion-reduce:hidden">
          <Confetti
            spreadDeg={300}
            launchSpeed={Math.min((window?.innerWidth ?? 0) / 1000, 1)}
            y={0.2}
            particleCount={120}
            shapeSize={Math.min((window?.innerWidth ?? 0) / 30, 20)}
          />
        </div>
      ) : null}
      <PageTitle>Daten spenden</PageTitle>
      <div className="grid gap-4 md:gap-8 md:grid-cols-2 grow">
        <div>
          <H3>Schritte</H3>
          <Accordion type="single" className="w-full" value={`step-${step}`}>
            <StepItem
              step={1}
              title="Eine Octopoda-ID erhalten"
              activeStep={step}
            >
              <p className="leading-loose">
                Um Daten zu spenden,{" "}
                <span className="italic">erhältst du eine Octopoda-ID</span> für
                deine EVCC Instanz.
              </p>
              <p className="leading-loose">
                Diese ID wird in deinem MQTT-Thema verwendet, um die Daten zu
                markieren, die von deiner Instanz kommen.
              </p>
              <p className="leading-loose">
                Du kannst dein Thema/ID speichern, um später deine analysierte
                Daten zu sehen.
              </p>
              <LoadingButton
                onClick={async () => {
                  const instanceId =
                    await generateInstanceIdMutation.mutateAsync({});
                  await navigate({ search: { instanceId, step: 2 } });
                }}
              >
                ID erhalten
              </LoadingButton>
            </StepItem>
            <StepItem
              step={2}
              title="MQTT Integration in EVCC hinzufügen"
              activeStep={step}
            >
              <p className="leading-loose">
                Öffne deine EVCC Web-UI, gehe in die Einstellungen und aktiviere
                die experimentellen UI-Features. Füge danach unsere MQTT
                Integration hinzu. Du musst nur das Thema (das deine ID enthält)
                und den Broker setzen, alles andere bleibt leer.
              </p>

              <div className="flex flex-wrap gap-y-2 items-center mb-1">
                <span className="font-semibold inline-block w-14">Broker:</span>{" "}
                <CopyableText
                  text={"wss://mqtt.octopoda.f2.htw-berlin.de"}
                  language="de"
                />
              </div>
              <div className="flex flex-wrap gap-y-2 items-center mt-1">
                <span className="font-semibold inline-block w-14">Thema:</span>{" "}
                <CopyableText text={`evcc/${instanceId!}`} />
              </div>
              <p className="leading-loose">
                <span className="italic">
                  Deine Daten werden nicht öffentlich gesendet.
                </span>{" "}
                Die Verbindung ist verschlüsselt und unser MQTT Server ist so
                konfiguriert, dass man ohne Authentifizierung Datenpunkte zu uns
                senden kann. Lesen können diese nur autorisierte Clients.
              </p>
              <div className="flex gap-2 grow">
                <Button asChild variant="secondary">
                  <Link
                    to={"/contribute"}
                    search={{ instanceId: undefined, step: 1 }}
                  >
                    Zurück
                  </Link>
                </Button>
                <Button asChild>
                  <Link
                    to={"/contribute"}
                    search={{ instanceId, step: 3 }}
                    className="grow"
                  >
                    MQTT Integration ist erledigt
                  </Link>
                </Button>
              </div>
            </StepItem>

            <StepItem
              step={3}
              title="EVCC neustarten & Verbindung überprüfen"
              activeStep={step}
            >
              <p className="leading-loose italic">
                Wenn du das noch nicht getan hast, starte deinen EVCC Server
                jetzt neu.
              </p>
              <p className="leading-loose">
                Deine Daten sollten in kürze ankommen! Wenn du innerhalb einer
                Minute keine Daten siehst, gehe zurück und überprüfe, ob deine
                MQTT Integration korrekt ist.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="secondary">
                  <Link to={"/contribute"} search={{ instanceId, step: 2 }}>
                    Zurück
                  </Link>
                </Button>

                <LoadingButton
                  loading={!latestInstanceUpdate.data}
                  onClick={() => {
                    void navigate({ search: { instanceId, step: 4 } });
                  }}
                  className="grow"
                >
                  {latestInstanceUpdate.data ? "Weiter" : "Warte auf Daten..."}
                </LoadingButton>
              </div>
            </StepItem>
            <StepItem step={4} title="Daten ansehen" activeStep={step}>
              <p className="leading-loose">
                Daten mit deiner Instance ID wurden empfangen!
              </p>
              <p className="leading-loose">
                Du kannst nun die Übersicht deiner Daten ansehen. Speichere dir
                den Link oder deine Instance ID, um dir später
                Analyse-Ergebnisse anzusehen.
              </p>
              <Button asChild>
                <Link
                  to="/view-data/$instanceId"
                  params={{ instanceId: instanceId! }}
                >
                  Daten ansehen
                </Link>
              </Button>
            </StepItem>
          </Accordion>
        </div>
        <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted">
          <VisualStepInstruction
            step={step}
            lastInstanceUpdate={latestInstanceUpdate.data}
          />
        </div>
      </div>
    </div>
  );
}

function VisualStepInstruction({
  step,
  lastInstanceUpdate,
}: {
  step: number;
  lastInstanceUpdate?: Date | null;
}) {
  if (step === 2)
    return (
      <div className="flex flex-col items-center gap-4 h-full w-full min-h-72">
        <H3>Anleitung</H3>
        <MiniInstructionGallery
          className="grid-cols-4 h-10 grow"
          steps={[
            {
              title: "Gehe in die EVCC Einstellungen",
              image: mqttInstruction1,
            },
            {
              title: "Aktiviere experimentelle Features",
              image: mqttInstruction2,
            },
            {
              title: "Erstelle eine neue MQTT Integration",
              image: mqttInstruction3,
            },
            {
              title: "Thema und Broker setzen",
              image: mqttInstruction4,
            },
          ]}
        />
      </div>
    );

  if (step < 3)
    return (
      <>
        <H3>[Platzhalter]</H3>
        <H3>Visuelle Anleitung für Schritt {step}</H3>
      </>
    );

  if (step === 3 && !lastInstanceUpdate)
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <H3>Warte auf Daten...</H3>
        <div className="rounded-full animate-pulse size-12 bg-primary"></div>
      </div>
    );
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <H3 className="flex items-center gap-2">
        Verbindung hergestellt <PartyPopperIcon />
      </H3>
      <p>Danke für deine Mitarbeit!</p>
      {lastInstanceUpdate ? (
        <p>Letzte empfangene Daten am: {format(lastInstanceUpdate, "PPpp")}</p>
      ) : null}
    </div>
  );
}
