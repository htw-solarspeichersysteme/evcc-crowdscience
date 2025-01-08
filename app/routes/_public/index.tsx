import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "~/components/ui/button";
import { PageTitle } from "~/components/ui/typography";

export const Route = createFileRoute("/_public/")({
  component: Home,
});

function Home() {
  return (
    <>
      <PageTitle>Octopoda Analytics</PageTitle>
      <div className="flex gap-4">
        <Button asChild>
          <Link to="/contribute">Contribute Data</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/view-data">View Your Data</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/dashboard">Go To Dashboard</Link>
        </Button>
      </div>
    </>
  );
}
