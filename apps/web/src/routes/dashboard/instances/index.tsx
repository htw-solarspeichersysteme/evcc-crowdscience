import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ChartCandlestickIcon } from "lucide-react";

import { DataTable } from "~/components/data-table";
import { InstancesFilter } from "~/components/instances-filter";
import { Button } from "~/components/ui/button";
import { useInstancesFilter } from "~/hooks/use-instances-filter";
import { orpc } from "~/orpc/client";

export const Route = createFileRoute("/dashboard/instances/")({
  component: RouteComponent,
  staticData: {
    routeTitle: "Instances",
  },
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      orpc.instances.getOverview.queryOptions(),
    );
  },
  wrapInSuspense: true,
});

function RouteComponent() {
  const { filteredInstances } = useInstancesFilter();
  const navigate = Route.useNavigate();

  return (
    <div className="flex flex-col gap-4">
      <InstancesFilter />
      <DataTable
        data={filteredInstances}
        onRowDoubleClick={(row) => {
          void navigate({
            to: "/dashboard/instances/$instanceId",
            params: { instanceId: row.id },
          });
        }}
        columns={[
          { accessorKey: "id", header: "Instance" },
          {
            accessorFn: (row) =>
              formatDistanceToNow(row.lastUpdate!, {
                addSuffix: true,
              }),
            header: "Last Update",
          },
          {
            accessorKey: "actions",
            header: "Actions",
            cell: ({ row }) => (
              <Button variant="outline" asChild>
                <Link
                  to={"/dashboard/instances/$instanceId"}
                  params={{ instanceId: row.original.id }}
                  className="flex flex-row items-center gap-2"
                >
                  View
                  <ChartCandlestickIcon className="size-4" />
                </Link>
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
