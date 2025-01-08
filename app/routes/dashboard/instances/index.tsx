import { createFileRoute, Link } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";

import { DataTable } from "~/components/data-table";
import { Button } from "~/components/ui/button";
import { instanceApi } from "~/serverHandlers/instance";

export const Route = createFileRoute("/dashboard/instances/")({
  component: RouteComponent,
  staticData: {
    routeTitle: "Instances",
  },
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(
      instanceApi.getActiveInstances.getOptions(),
    );
  },
  wrapInSuspense: true,
});

function RouteComponent() {
  const { data: instances } = instanceApi.getActiveInstances.useSuspenseQuery();

  return (
    <DataTable
      data={instances}
      columns={[
        { accessorKey: "id", header: "Instance" },
        {
          accessorKey: "actions",
          header: "Actions",
          cell: ({ row }) => (
            <Button variant="outline" size="icon" asChild>
              <Link
                to={"/dashboard/instances/$instanceId"}
                params={{ instanceId: row.original.id }}
              >
                <EyeIcon className="size-4" />
              </Link>
            </Button>
          ),
        },
      ]}
    />
  );
}
