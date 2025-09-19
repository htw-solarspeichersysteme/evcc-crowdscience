import { useState } from "react";
import { AccordionHeader, AccordionTrigger } from "@radix-ui/react-accordion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { differenceInMinutes, format } from "date-fns";
import { PartyPopperIcon } from "lucide-react";
import Confetti from "react-confetti-boom";
import { z } from "zod";

import mqttInstruction1 from "~/assets/instructions/mqtt-instruction-1.png";
import mqttInstruction2 from "~/assets/instructions/mqtt-instruction-2.png";
import mqttInstruction3 from "~/assets/instructions/mqtt-instruction-3.png";
import mqttInstruction4 from "~/assets/instructions/mqtt-instruction-4.png";
import { CopyableText } from "~/components/copyable-text";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "~/components/ui/accordion";
import { Button, LoadingButton } from "~/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import { Checkbox } from "~/components/ui/checkbox";
import { H3, PageTitle } from "~/components/ui/typography";
import { cn } from "~/lib/utils";
import { orpc } from "~/orpc/client";
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
        <AccordionTrigger className="flex cursor-default items-center gap-2 py-4 font-medium transition-all">
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
  const generateInstanceIdMutation = useMutation(
    orpc.instances.generateId.mutationOptions(),
  );

  const latestInstanceUpdate = useQuery(
    orpc.instances.getLatestUpdate.queryOptions({
      input: { instanceId: instanceId! },
      enabled: Boolean(instanceId) && step > 2,
      select: (data) => {
        if (!data || differenceInMinutes(new Date(), data) > 3)
          return undefined;
        return data;
      },
      refetchInterval: 5000,
    }),
  );

  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="mx-auto max-w-(--max-content-width)">
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
      <div className="grid grow gap-4 md:grid-cols-2 md:gap-8">
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
              <div className="mb-4 flex items-center">
                <div className="items-top flex space-x-2">
                  <Checkbox
                    id="terms1"
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      setIsChecked(
                        checked === "indeterminate" ? false : checked,
                      )
                    }
                  ></Checkbox>
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
                  await navigate({
                    replace: true,
                    search: { instanceId, step: 2 },
                  });
                }}
                disabled={!isChecked}
                className={`mt-4 w-full rounded-md px-4 py-2`}
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
                <ol className="list-decimal space-y-2 pl-6">
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

              <div className="mb-1 flex flex-wrap items-center gap-y-2">
                <span className="inline-block w-14 font-semibold">Broker:</span>{" "}
                <CopyableText
                  text={"wss://mqtt.octopoda.f2.htw-berlin.de"}
                  language="de"
                />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-y-2">
                <span className="inline-block w-14 font-semibold">Thema:</span>{" "}
                <CopyableText text={`evcc/${instanceId!}`} language="de" />
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
              <div className="flex grow gap-2">
                <Button asChild variant="secondary">
                  <Link
                    to={"/contribute"}
                    search={{ instanceId: undefined, step: 1 }}
                    replace
                  >
                    Zurück
                  </Link>
                </Button>
                <Button asChild>
                  <Link
                    to={"/contribute"}
                    search={{ instanceId, step: 3 }}
                    className="grow"
                    replace
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
                  <Link
                    to={"/contribute"}
                    search={{ instanceId, step: 2 }}
                    replace
                  >
                    Zurück
                  </Link>
                </Button>

                <LoadingButton
                  loading={!latestInstanceUpdate.data}
                  onClick={() => {
                    void navigate({
                      replace: true,
                      search: { instanceId, step: 4 },
                    });
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
        <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-4">
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
      <div className="max-h-[70vh] min-h-[60vh] overflow-auto">
        <PrivacyComponent />
      </div>
    );
  if (step === 2)
    return (
      <div className="relative flex max-h-[70vh] min-h-72 w-full flex-col items-center gap-4">
        <H3>Anleitung</H3>
        <Carousel className="relative w-full">
          <CarouselContent>
            <CarouselItem className="flex items-center justify-center">
              <img
                src={mqttInstruction1}
                alt="Gehe in die EVCC Einstellungen"
                className="max-h-[50vh] rounded-lg object-contain"
              />
            </CarouselItem>
            <CarouselItem className="flex items-center justify-center">
              <img
                src={mqttInstruction2}
                alt="Aktiviere experimentelle Features"
                className="max-h-[50vh] rounded-lg object-contain"
              />
            </CarouselItem>
            <CarouselItem className="flex items-center justify-center">
              <img
                src={mqttInstruction3}
                alt="Erstelle eine neue MQTT Integration"
                className="max-h-[50vh] rounded-lg object-contain"
              />
            </CarouselItem>
            <CarouselItem className="flex items-center justify-center">
              <img
                src={mqttInstruction4}
                alt="Thema und Broker setzen"
                className="max-h-[50vh] rounded-lg object-contain"
              />
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="absolute top-1/2 left-4 z-10 -translate-y-1/2 transform" />
          <CarouselNext className="absolute top-1/2 right-4 z-10 -translate-y-1/2 transform" />
        </Carousel>
      </div>
    );
  if (step === 3 && !lastInstanceUpdate)
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <H3>Warte auf Daten...</H3>
        <div className="size-12 animate-pulse rounded-full bg-primary"></div>
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
