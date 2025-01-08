import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PageTitle } from "~/components/ui/typography";

export const Route = createFileRoute("/_public/view-data/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  return (
    <>
      <PageTitle>View Your Data</PageTitle>

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
        <p>
          You can view your data by entering your Instance ID below. If you
          don't have an Instance ID, you can contribute data to get one.
        </p>
        <Input
          type="text"
          name="instanceId"
          placeholder="Instance ID"
          required
        />
        <Button type="submit" className="ml-auto">
          Show Data
        </Button>
      </form>
    </>
  );
}
