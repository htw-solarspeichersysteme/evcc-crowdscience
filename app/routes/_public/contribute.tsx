import { useState } from "react";
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
import { Checkbox } from "~/components/ui/checkbox";
import { H3, PageTitle } from "~/components/ui/typography";
import { cn } from "~/lib/utils";
import { instanceApi } from "~/serverHandlers/instance";
import { RouteComponent as PrivacyComponent } from "./privacy";

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
        <AccordionTrigger className="flex items-center gap-2 py-4 font-medium transition-all cursor-default rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
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

  const [isChecked, setIsChecked] = useState(false);
  const handleCheckboxChange = () => {
    setIsChecked((prev) => !prev);
  };

  return (
    <div className="max-w-2xl lg:max-w-5xl mx-auto">
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
                <span className="italic">erhältst du eine Octopoda-ID</span>,
                die deiner evcc-Instanz zugeordnet wird.
              </p>
              <p className="leading-loose">
                Diese ID wird in deinem MQTT-Thema verwendet, um die Daten zu
                markieren, die von deiner Instanz kommen.
              </p>
              <p className="leading-loose">
                Du kannst die ID speichern, um später auf deine analysierten
                Daten zuzugreifen.
              </p>
              <p className="leading-loose">
                Deine Daten werden ausschließlich anonymisiert und für
                wissenschaftliche Zwecke verwendet.
              </p>
              <div className="flex items-center mb-4">
                <div className="items-top flex space-x-2">
                  <Checkbox
                    id="terms1"
                    checked={isChecked}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms1"
                      className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Ich habe die{" "}
                      <a
                        href="/privacy"
                        className="font-bold text-primary underline hover:no-underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Datenschutzerklärung
                      </a>{" "}
                      gelesen und stimme der anonymisierten Verarbeitung meiner
                      Daten zu.
                    </label>
                  </div>
                </div>
              </div>

              <LoadingButton
                onClick={async () => {
                  const instanceId =
                    await generateInstanceIdMutation.mutateAsync({});
                  await navigate({ search: { instanceId, step: 2 } });
                }}
                disabled={!isChecked}
                className={`w-full py-2 px-4 mt-4 rounded-md`}
              >
                ID erhalten
              </LoadingButton>
            </StepItem>
            <StepItem
              step={2}
              title="MQTT-Integration in evcc hinzufügen"
              activeStep={step}
            >
              <p className="leading-loose">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Öffne deine evcc Web-UI</li>
                  <li>
                    gehe in die Einstellung zu{" "}
                    <span className="font-bold">Konfiguration</span> und
                    aktiviere die{" "}
                    <span className="font-bold">
                      {" "}
                      experimentellen UI-Features
                    </span>{" "}
                    (Experimentell: <span className="font-bold">an</span> ) im
                    Allgemeinen Teil.
                  </li>
                  <li>
                    Im <span className="font-bold"> Integration</span>-Teil
                    unsere MQTT-Integration hinzufügen. <br /> Du musst nur das
                    Thema (das deine ID enthält) und den Broker setzen,{" "}
                    <span className="font-bold"> alles andere bleibt leer</span>
                    .
                  </li>
                </ol>
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
              <div className="gap-2"></div>
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
                    MQTT-Integration ist erledigt
                  </Link>
                </Button>
              </div>
            </StepItem>

            <StepItem
              step={3}
              title="evcc neu starten & Verbindung überprüfen"
              activeStep={step}
            >
              <p className="leading-loose italic">
                Wenn du das noch nicht getan hast:{" "}
                <span className="font-bold">
                  starte deinen evcc-Server jetzt neu
                </span>
                .
              </p>
              <p className="leading-loose">
                Deine Daten sollten in kürze ankommen! Wenn du innerhalb einer
                Minute keine Daten siehst, gehe zurück und überprüfe, ob deine
                MQTT-Integration korrekt ist.
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
                Daten mit deiner Instance-ID wurden empfangen!
              </p>
              <p className="leading-loose">
                Du kannst nun die Übersicht deiner Daten ansehen. Speichere dir
                den Link oder deine Instance-ID, um dir später
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
  if (step === 1)
    return (
      <div className="min-h-[60vh] max-h-[70vh] overflow-auto">
        <PrivacyComponent />
      </div>
    );
  if (step === 2)
    return (
      <div className="flex flex-col items-center gap-4 h-full w-full min-h-72 ">
        <H3>Anleitung</H3>
        <MiniInstructionGallery
          className="grid-cols-4 h-10 grow "
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
