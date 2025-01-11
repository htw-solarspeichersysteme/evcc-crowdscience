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
      <PageTitle>Contribute Data</PageTitle>
      <div className="grid gap-4 md:gap-8 md:grid-cols-2 grow">
        <div>
          <H3>Steps</H3>
          <Accordion type="single" className="w-full" value={`step-${step}`}>
            <StepItem step={1} title="Get an octopoda ID" activeStep={step}>
              <p className="leading-loose">
                To contribute data to the platform, you will{" "}
                <span className="italic">get assigned an octopoda-ID</span> for
                your EVCC instance.
              </p>
              <p className="leading-loose">
                This ID will be used in your MQTT topic to tag the data coming
                from your instance.
              </p>
              <p className="leading-loose">
                You can save your topic/ID to view your analyzed data later.
              </p>
              <LoadingButton
                onClick={async () => {
                  const instanceId =
                    await generateInstanceIdMutation.mutateAsync({});
                  await navigate({ search: { instanceId, step: 2 } });
                }}
              >
                create an ID for me
              </LoadingButton>
            </StepItem>
            <StepItem
              step={2}
              title="Add MQTT Integration in EVCC"
              activeStep={step}
            >
              <p className="leading-loose">
                Open your EVCC Web-UI, enable the experimental UI features and
                add our MQTT Integration. You only need to set the topic (which
                includes your ID) and broker, everything else should be blank.
              </p>
              <div className="flex flex-wrap gap-y-2 items-center mt-1">
                <span className="font-semibold inline-block w-14">Topic:</span>{" "}
                <CopyableText text={`evcc/${instanceId!}`} />
              </div>
              <div className="flex flex-wrap gap-y-2 items-center mb-1">
                <span className="font-semibold inline-block w-14">Broker:</span>{" "}
                <CopyableText text={"wss://mqtt.octopoda.f2.htw-berlin.de"} />
              </div>
              <p className="leading-loose">
                <span className="italic">
                  Your data will not be sent publicly.
                </span>
                The connection is encrypted and our MQTT Server is configured in
                a way where everyone can send data points, but only authorized
                clients can read them.
              </p>
              <div className="flex gap-2 grow">
                <Button asChild variant="secondary">
                  <Link
                    to={"/contribute"}
                    search={{ instanceId: undefined, step: 1 }}
                  >
                    Go Back
                  </Link>
                </Button>
                <Button asChild>
                  <Link
                    to={"/contribute"}
                    search={{ instanceId, step: 3 }}
                    className="grow"
                  >
                    I&apos;ve added the MQTT Integration
                  </Link>
                </Button>
              </div>
            </StepItem>

            <StepItem
              step={3}
              title="Restart & Validate Connection"
              activeStep={step}
            >
              <p className="leading-loose italic">
                If you haven&apos;t already, restart your EVCC Server now.
              </p>
              <p className="leading-loose">
                Your Data should arrive in any moment! If you don&apos;t see any
                data within a minute after restart, please go back and make sure
                your MQTT integration is correct.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="secondary">
                  <Link to={"/contribute"} search={{ instanceId, step: 2 }}>
                    Go Back
                  </Link>
                </Button>

                <LoadingButton
                  loading={!latestInstanceUpdate.data}
                  onClick={() => {
                    void navigate({ search: { instanceId, step: 4 } });
                  }}
                  className="grow"
                >
                  {latestInstanceUpdate.data ? "Continue" : "Waiting for Data"}
                </LoadingButton>
              </div>
            </StepItem>
            <StepItem step={4} title="View Data" activeStep={step}>
              <p className="leading-loose">
                Data with your Instance ID has been received.
              </p>
              <Button asChild>
                <Link
                  to="/view-data/$instanceId"
                  params={{ instanceId: instanceId! }}
                >
                  View Your Data
                </Link>
              </Button>
            </StepItem>
          </Accordion>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/contribute">Reset</Link>
          </Button>
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
        <H3 className="">Instructions</H3>
        <MiniInstructionGallery
          className="grid-cols-4 h-10 grow"
          steps={[
            {
              title: "Go into the EVCC Settings",
              image: mqttInstruction1,
            },
            {
              title: "Enable Experimental Features",
              image: mqttInstruction2,
            },
            {
              title: "Create a new MQTT Integration",
              image: mqttInstruction3,
            },
            {
              title: "Enter Topic and Broker",
              image: mqttInstruction4,
            },
          ]}
        />
      </div>
    );

  if (step < 3)
    return (
      <>
        <H3>[Placeholder]</H3>
        <H3>Visual Instructions for Step {step}</H3>
      </>
    );

  if (step === 3 && !lastInstanceUpdate)
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <H3>Waiting for data...</H3>
        <div className="rounded-full animate-pulse size-12 bg-primary"></div>
      </div>
    );
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <H3 className="flex items-center gap-2">
        Success <PartyPopperIcon />
      </H3>
      <p>Thank you for your contribution!</p>
      {lastInstanceUpdate ? (
        <p>Latest udpate: {format(lastInstanceUpdate, "PPpp")}</p>
      ) : null}
    </div>
  );
}
