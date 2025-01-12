import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { EyeIcon } from "lucide-react";

import { DataTable } from "~/components/data-table";
import { InstancesFilter } from "~/components/instances-filter";
import { Button } from "~/components/ui/button";
import { instanceApi } from "~/serverHandlers/instance";

export const Route = createFileRoute("/dashboard/instances/")({
  component: RouteComponent,
  staticData: {
    routeTitle: "Instances",
  },
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context, deps }) => {
    await context.queryClient.prefetchQuery(
      instanceApi.getActiveInstances.getOptions({
        data: deps.search.iFltr ?? {},
      }),
    );
  },
  wrapInSuspense: true,
});

function RouteComponent() {
  const { data: instances } = instanceApi.getActiveInstances.useSuspenseQuery();

  return (
    <div className="flex flex-col gap-4">
      <InstancesFilter routeId={Route.id} />
      <DataTable
        data={instances}
        columns={[
          { accessorKey: "id", header: "Instance" },
          {
            accessorFn: (row) =>
              formatDistanceToNow(row.lastUpdate, {
                addSuffix: true,
              }),
            header: "Last Update",
          },
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
    </div>
  );
}
