import { AccordionHeader, AccordionTrigger } from "@radix-ui/react-accordion";
import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { PartyPopperIcon } from "lucide-react";
import { z } from "zod";

import { CopyableText } from "~/components/copyable-text";
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
});

function StepItem({
  step,
  activeStep,
  title,
  children,
}: {
  step: number;
  activeStep: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={`step-${step}`}>
      <AccordionHeader className="flex">
        <AccordionTrigger className="flex items-center gap-2 py-4 font-medium transition-all cursor-default">
          <div
            className={cn(
              "flex size-6 items-center justify-center rounded-full transition-colors",
              step === activeStep && "bg-primary text-primary-foreground",
            )}
          >
            {step}
          </div>
          <span className="">{title}</span>
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent className={cn("flex flex-col gap-2")}>
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

  const isInstanceActiveQuery = instanceApi.isInstanceActive.useQuery({
    variables: { data: { instanceId: instanceId! } },
    enabled: !!instanceId && step === 3,
    refetchInterval: 3000,
  });

  if (instanceId && step === 1) {
    console.log("navigating to step 2");
    void navigate({
      search: (prev) => ({ ...prev, step: 2 }),
    });
  }

  if (instanceId && isInstanceActiveQuery.data) {
    void navigate({
      search: (prev) => ({ ...prev, step: 4 }),
    });
  }

  console.log(isInstanceActiveQuery.data);

  return (
    <>
      <PageTitle>Contribute Data</PageTitle>
      <div className="grid gap-4 md:gap-8 md:grid-cols-2">
        <div>
          <H3>Steps</H3>
          <Accordion type="single" className="w-full" value={`step-${step}`}>
            <StepItem
              step={1}
              title="Generate your instance ID"
              activeStep={step}
            >
              <p className="leading-loose">
                To contribute data to the platform, you need to generate an
                instance ID. This ID is used to identify your EVCC Instance and
                makes sure that the data does not get mixed up with other
                instances.
              </p>
              <LoadingButton
                onClick={async () => {
                  const instanceId =
                    await generateInstanceIdMutation.mutateAsync({});
                  await navigate({ search: { instanceId, step: 2 } });
                }}
              >
                Generate my ID
              </LoadingButton>
            </StepItem>
            <StepItem
              step={2}
              title="Add MQTT Integration in EVCC"
              activeStep={step}
            >
              <p className="leading-loose">
                Your instance ID: <CopyableText text={instanceId!} />
              </p>
              <p className="leading-loose">
                To contribute data to the platform, you need to add MQTT
                integration in your EVCC Config.
              </p>
              <Button asChild>
                <Link to={"/contribute"} search={{ instanceId, step: 3 }}>
                  I&apos;ve added the MQTT Integration
                </Link>
              </Button>
            </StepItem>

            <StepItem step={3} title="Validate Connection" activeStep={step}>
              <p className="leading-loose">
                Your Data should arrive in any moment! If you don&apos;t see any
                data, please go back and check your MQTT integration is correct.
              </p>
              <Button asChild variant="outline">
                <Link to={"/contribute"} search={{ instanceId, step: 2 }}>
                  Check my MQTT Integration
                </Link>
              </Button>
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
        </div>
        <div className="flex flex-col items-center justify-center h-full rounded-lg bg-muted min-h-72">
          <VisualStepInstruction step={step} />
        </div>
      </div>
      <Button asChild className="mt-4" variant="outline">
        <Link to="/contribute">Reset</Link>
      </Button>
    </>
  );
}

function VisualStepInstruction({ step }: { step: number }) {
  if (step < 3)
    return (
      <>
        <H3>[Placeholder]</H3>
        <H3>Visual Instructions for Step {step}</H3>
      </>
    );

  if (step === 3)
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
    </div>
  );
}
