import { useState } from "react";
import { AccordionHeader, AccordionTrigger } from "@radix-ui/react-accordion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { differenceInMinutes, format } from "date-fns";
import { PartyPopperIcon } from "lucide-react";
import Confetti from "react-confetti-boom";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import { CopyableText } from "~/components/copyable-text";
import { PrivacyText } from "~/components/privacy-text";
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
import homeassistantInstruction1 from "../../assets/instructions/homeassistant-instruction-1.png";
import homeassistantInstruction2 from "../../assets/instructions/homeassistant-instruction-2.png";
import homeassistantInstruction3 from "../../assets/instructions/homeassistant-instruction-3.png";
import homeassistantInstruction4 from "../../assets/instructions/homeassistant-instruction-4.png";
import linuxInstruction1 from "../../assets/instructions/linux-instruction-1.png";
import linuxInstruction2 from "../../assets/instructions/linux-instruction-2.png";
import linuxInstruction3 from "../../assets/instructions/linux-instruction-3.png";
import linuxInstruction4 from "../../assets/instructions/linux-instruction-4.png";
import mqttInstruction1 from "../../assets/instructions/mqtt-instruction-1.png";
import mqttInstruction2 from "../../assets/instructions/mqtt-instruction-2.png";
import mqttInstruction3 from "../../assets/instructions/mqtt-instruction-3.png";
import mqttInstruction4 from "../../assets/instructions/mqtt-instruction-4.png";

export const Route = createFileRoute("/_public/mitmachen")({
  component: RouteComponent,
  validateSearch: z.object({
    instanceId: z.string().optional(),
    step: z.number().default(1),
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
  const { t } = useTranslation();
  const generateInstanceIdMutation = useMutation(
    orpc.instances.generateId.mutationOptions(),
  );

  const latestInstanceUpdate = useQuery(
    orpc.instances.getLatestUpdate.queryOptions({
      input: { instanceId: instanceId! },
      enabled: Boolean(instanceId) && step > 2,
      select: (data) => {
        if (!data || differenceInMinutes(new Date(), new Date(data)) > 3)
          return undefined;
        return data;
      },
      refetchInterval: 5000,
    }),
  );

  const [isChecked, setIsChecked] = useState(false);
  const [hasBrokerAlready, setHasBrokerAlready] = useState(false);
  const [usesLinux, setUsesLinux] = useState(true);

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
      <PageTitle>{t("mitmachen.title")}</PageTitle>
      <div className="grid grow gap-4 md:grid-cols-2 md:gap-8">
        <div>
          <H3>{t("mitmachen.stepsTitle")}</H3>
          <Accordion type="single" className="w-full" value={`step-${step}`}>
            <StepItem
              step={1}
              title={t("mitmachen.step1.title")}
              activeStep={step}
            >
              <p className="leading-loose">{t("mitmachen.step1.paragraph1")}</p>
              <p className="leading-loose">{t("mitmachen.step1.paragraph2")}</p>
              <p className="leading-loose">{t("mitmachen.step1.paragraph3")}</p>
              <p className="leading-loose">{t("mitmachen.step1.paragraph4")}</p>
              <div className="mb-4 flex items-center">
                <div className="flex space-x-2">
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
                      {t("mitmachen.step1.consentBefore")}{" "}
                      <Link
                        to="/datenschutz"
                        className="font-bold text-primary underline hover:no-underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("mitmachen.step1.consentLink")}
                      </Link>{" "}
                      {t("mitmachen.step1.consentAfter")}
                    </label>
                  </div>
                </div>
              </div>

              <LoadingButton
                onClick={async () => {
                  const instanceIdPair =
                    await generateInstanceIdMutation.mutateAsync({});
                  await navigate({
                    replace: true,
                    search: { instanceId: instanceIdPair.id, step: 2 },
                  });
                }}
                disabled={!isChecked}
                className={`mt-4 w-full rounded-md px-4 py-2`}
              >
                {t("mitmachen.step1.button")}
              </LoadingButton>
            </StepItem>
            <StepItem
              step={2}
              title={t("mitmachen.step2.title")}
              activeStep={step}
            >
              <p className="leading-loose">{t("mitmachen.step2.question")}</p>

              <div className="my-3 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setHasBrokerAlready(false)}
                  className={cn(
                    "min-w-[120px] cursor-pointer rounded-md px-3 py-2",
                    !hasBrokerAlready
                      ? "bg-primary text-primary-foreground"
                      : "bg-background",
                  )}
                >
                  {t("mitmachen.step2.no")}
                </button>
                <button
                  type="button"
                  onClick={() => setHasBrokerAlready(true)}
                  className={cn(
                    "min-w-[120px] cursor-pointer rounded-md px-3 py-2",
                    hasBrokerAlready
                      ? "bg-primary text-primary-foreground"
                      : "bg-background",
                  )}
                >
                  {t("mitmachen.step2.yes")}
                </button>
              </div>

              {!hasBrokerAlready ? (
                <div>
                  <ol className="list-decimal space-y-2 pl-6">
                    <li>{t("mitmachen.step2.noBroker.step1")}</li>
                    <li>{t("mitmachen.step2.noBroker.step2")}</li>
                    <li>{t("mitmachen.step2.noBroker.step3")}</li>
                  </ol>

                  <div className="mb-1 flex flex-wrap items-center gap-y-2">
                    <span className="inline-block w-14 font-semibold">
                      {t("mitmachen.step2.noBroker.brokerLabel")}
                    </span>{" "}
                    <CopyableText
                      text={t("mitmachen.step2.noBroker.brokerValue")}
                      language="de"
                    />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-y-2">
                    <span className="inline-block w-14 font-semibold">
                      {t("mitmachen.step2.noBroker.topicLabel")}
                    </span>{" "}
                    <CopyableText
                      text={t("mitmachen.step2.noBroker.topicValue", {
                        instanceId: instanceId!,
                      })}
                      language="de"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="italic">
                    {t("mitmachen.step2.withBroker.notice")}
                  </p>
                  <p className="leading-loose">
                    {t("mitmachen.step2.withBroker.question")}
                  </p>

                  <div className="my-3 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUsesLinux(true)}
                      className={cn(
                        "min-w-[120px] cursor-pointer rounded-md px-3 py-2",
                        usesLinux
                          ? "bg-primary text-primary-foreground"
                          : "bg-background",
                      )}
                    >
                      {t("mitmachen.step2.withBroker.linux")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUsesLinux(false)}
                      className={cn(
                        "min-w-[120px] cursor-pointer rounded-md px-3 py-2",
                        !usesLinux
                          ? "bg-primary text-primary-foreground"
                          : "bg-background",
                      )}
                    >
                      {t("mitmachen.step2.withBroker.homeAssistant")}
                    </button>
                  </div>
                  <ol className="list-decimal space-y-2 pl-6">
                    <li>
                      {t("mitmachen.step2.withBroker.bridgeIntro")}{" "}
                      <span className="font-bold">bridge-evcc.conf</span>:
                      <CopyableText
                        className="max-h-18"
                        text={t("mitmachen.step2.withBroker.bridgeConfig", {
                          instanceId: instanceId!,
                        })}
                        language="de"
                      />
                    </li>
                    {usesLinux ? (
                      <>
                        <li>
                          {t("mitmachen.step2.withBroker.topicLine")}
                          <CopyableText
                            text={t("mitmachen.step2.withBroker.topicConfig", {
                              instanceId: instanceId!,
                            })}
                            language="de"
                          />
                        </li>
                        <li>
                          {t("mitmachen.step2.withBroker.linuxCopyBefore")}{" "}
                          <span className="font-bold">
                            /etc/mosquitto/conf.d/bridge-evcc.conf
                          </span>{" "}
                          {t("mitmachen.step2.withBroker.linuxCopyAfter")}
                        </li>
                        <li>
                          {t("mitmachen.step2.withBroker.linuxRestart")}
                          <CopyableText
                            text={t(
                              "mitmachen.step2.withBroker.restartCommand",
                            )}
                            language="de"
                          />
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          {t("mitmachen.step2.withBroker.topicLine")}
                          <CopyableText
                            text={t("mitmachen.step2.withBroker.topicConfig", {
                              instanceId: instanceId!,
                            })}
                            language="de"
                          />
                        </li>
                        <li>
                          {t("mitmachen.step2.withBroker.homeCopyBefore")}{" "}
                          <span className="font-bold">
                            /share/mosquitto/bridge-evcc.conf
                          </span>{" "}
                          {t("mitmachen.step2.withBroker.homeCopyAfter")}
                        </li>

                        <li>
                          {t("mitmachen.step2.withBroker.homeConfig")}
                          <br />
                          <span className="font-bold">
                            {t("mitmachen.step2.withBroker.homeCustomize")}
                          </span>{" "}
                          {t("mitmachen.step2.withBroker.homeCustomizeAfter")}
                        </li>
                        <li>
                          {t("mitmachen.step2.withBroker.homeRestartBefore")}{" "}
                          <span className="font-bold">
                            {t("mitmachen.step2.withBroker.homeRestartAddon")}
                          </span>{" "}
                          {t("mitmachen.step2.withBroker.homeRestartAfter")}
                        </li>
                      </>
                    )}
                  </ol>
                </div>
              )}
              <p className="leading-loose">
                <span className="italic">
                  {t("mitmachen.step2.withBroker.privatePrefix")}
                </span>{" "}
                {t("mitmachen.step2.withBroker.privateSuffix")}
              </p>

              <div className="flex grow gap-2">
                <Button asChild variant="secondary">
                  <Link
                    to={"/mitmachen"}
                    search={{ instanceId: undefined, step: 1 }}
                    replace
                  >
                    {t("mitmachen.step2.back")}
                  </Link>
                </Button>
                <Button asChild>
                  <Link
                    to={"/mitmachen"}
                    search={{ instanceId, step: 3 }}
                    className="grow"
                    replace
                  >
                    {t("mitmachen.step2.done")}
                  </Link>
                </Button>
              </div>
            </StepItem>

            <StepItem
              step={3}
              title={t("mitmachen.step3.title")}
              activeStep={step}
            >
              <p className="leading-loose italic">
                {t("mitmachen.step3.intro")}{" "}
                <span className="font-bold">
                  {t("mitmachen.step3.restart")}
                </span>
                .
              </p>
              <p className="leading-loose">{t("mitmachen.step3.status")}</p>
              <div className="flex gap-2">
                <Button asChild variant="secondary">
                  <Link
                    to={"/mitmachen"}
                    search={{ instanceId, step: 2 }}
                    replace
                  >
                    {t("mitmachen.step3.back")}
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
                  {latestInstanceUpdate.data
                    ? t("mitmachen.step3.next")
                    : t("mitmachen.step3.waiting")}
                </LoadingButton>
              </div>
            </StepItem>
            <StepItem
              step={4}
              title={t("mitmachen.step4.title")}
              activeStep={step}
            >
              <p className="leading-loose">{t("mitmachen.step4.received")}</p>
              <p className="leading-loose">{t("mitmachen.step4.summary")}</p>
              <Button asChild>
                <Link
                  to="/view-data/$instanceId"
                  params={{ instanceId: instanceId! }}
                >
                  {t("mitmachen.step4.button")}
                </Link>
              </Button>
            </StepItem>
          </Accordion>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-4">
          <VisualStepInstruction
            step={step}
            lastInstanceUpdate={latestInstanceUpdate.data}
            hasBrokerAlready={hasBrokerAlready}
            usesLinux={usesLinux}
          />
        </div>
      </div>
    </div>
  );
}

function VisualStepInstruction({
  step,
  lastInstanceUpdate,
  hasBrokerAlready,
  usesLinux,
}: {
  step: number;
  lastInstanceUpdate?: number | null;
  hasBrokerAlready: boolean;
  usesLinux: boolean;
}) {
  const { t } = useTranslation();
  if (step === 1)
    return (
      <div className="max-h-[70vh] min-h-[60vh] overflow-auto">
        <PrivacyText />
      </div>
    );
  if (step === 2)
    return (
      <div className="relative flex max-h-[70vh] min-h-72 w-full flex-col items-center gap-4">
        <H3>{t("mitmachen.visual.instruction")}</H3>
        <Carousel className="relative w-full">
          {hasBrokerAlready ? (
            usesLinux ? (
              <CarouselContent>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={linuxInstruction1}
                    alt="Linux: bridge-evcc.conf erstellen"
                    className="max-h-[50vh] w-3/4 rounded-lg object-contain"
                  />
                </CarouselItem>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={linuxInstruction2}
                    alt="Linux: Text in bridge-evcc.conf einfügen"
                    className="max-h-[50vh] w-3/4 rounded-lg object-contain"
                  />
                </CarouselItem>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={linuxInstruction3}
                    alt="Linux: Datei nach /etc/mosquitto/conf.d/ kopieren"
                    className="max-h-[50vh] w-3/4 rounded-lg object-contain"
                  />
                </CarouselItem>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={linuxInstruction4}
                    alt="Linux: Mosquitto neu starten"
                    className="max-h-[50vh] w-3/4 rounded-lg object-contain"
                  />
                </CarouselItem>
              </CarouselContent>
            ) : (
              <CarouselContent>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={homeassistantInstruction1}
                    alt="Gehe in die Apps Einstellungen"
                    className="max-h-[50vh] rounded-lg object-contain"
                  />
                </CarouselItem>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={homeassistantInstruction2}
                    alt="Klicke auf Mosquitto broker"
                    className="max-h-[50vh] rounded-lg object-contain"
                  />
                </CarouselItem>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={homeassistantInstruction3}
                    alt="Klicke auf Konfiguration"
                    className="max-h-[50vh] rounded-lg object-contain"
                  />
                </CarouselItem>
                <CarouselItem className="flex items-center justify-center">
                  <img
                    src={homeassistantInstruction4}
                    alt="Aktiviere Customize und speichere"
                    className="max-h-[50vh] rounded-lg object-contain"
                  />
                </CarouselItem>
              </CarouselContent>
            )
          ) : (
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
          )}
          <CarouselPrevious className="absolute top-1/2 left-4 z-10 -translate-y-1/2 transform" />
          <CarouselNext className="absolute top-1/2 right-4 z-10 -translate-y-1/2 transform" />
        </Carousel>
      </div>
    );
  if (step === 3 && !lastInstanceUpdate)
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <H3>{t("mitmachen.visual.waiting")}</H3>
        <div className="size-12 animate-pulse rounded-full bg-primary"></div>
      </div>
    );
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <H3 className="flex items-center gap-2">
        {t("mitmachen.visual.connected")} <PartyPopperIcon />
      </H3>
      <p>{t("mitmachen.visual.thanks")}</p>
      {lastInstanceUpdate ? (
        <p>
          {t("mitmachen.visual.lastReceivedPrefix")}{" "}
          {format(new Date(lastInstanceUpdate), "PPpp")}
        </p>
      ) : null}
    </div>
  );
}
