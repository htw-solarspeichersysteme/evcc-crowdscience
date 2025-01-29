import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PageTitle } from "~/components/ui/typography";

export const Route = createFileRoute("/_public/view-data/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl lg:max-w-5xl mx-auto grow">
      <PageTitle>Eigene Daten einsehen</PageTitle>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const instanceId = formData.get("instanceId") as string;
          void navigate({
            to: "/view-data/$instanceId",
            params: { instanceId },
          });
        }}
      >
        <p className="leading-loose">
          Du kannst deine Daten einsehen, indem du die Octopoda-ID für deine
          Instanz unten eingibst. <br />
          Noch keine Octopoda-ID? Du kannst deine{" "}
          <Link
            to="/contribute"
            className="font-bold text-primary underline hover:no-underline"
          >
            Daten beitragen
          </Link>
          , um eine zu erhalten!
        </p>
        <Input
          type="text"
          name="instanceId"
          placeholder="Octopoda-ID"
          required
        />
        <Button type="submit" className="ml-auto">
          Daten anzeigen
        </Button>
      </form>
    </div>
  );
}
