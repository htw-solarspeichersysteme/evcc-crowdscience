import { createFileRoute, Link } from "@tanstack/react-router";
import { format, formatDistanceToNow } from "date-fns";
import { ChartCandlestickIcon } from "lucide-react";

import { DataTable } from "~/components/data-table";
import { InstancesFilter } from "~/components/instances-filter";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
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

function TimeDistanceCell({ date }: { date: Date | null }) {
  const text = date ? formatDistanceToNow(date, { addSuffix: true }) : "--";
  // tooltip the date
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-sm">{text}</span>
      </TooltipTrigger>
      <TooltipContent side="top" align="center">
        {date ? format(date, "yyyy-MM-dd HH:mm:ss") : "no data yet"}
      </TooltipContent>
    </Tooltip>
  );
}

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
          { accessorKey: "publicName", header: "Instance" },
          {
            cell: ({ row }) =>
              TimeDistanceCell({ date: row.original.lastReceivedDataAt }),
            header: "Last Update",
          },
          {
            cell: ({ row }) =>
              TimeDistanceCell({ date: row.original.firstReceivedDataAt }),
            header: "First Update",
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
