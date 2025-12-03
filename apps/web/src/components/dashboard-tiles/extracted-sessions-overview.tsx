import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { differenceInSeconds, formatDate } from "date-fns";
import { RefreshCcwIcon, TrashIcon } from "lucide-react";

import { ExpandableDashboardGraph } from "~/components/dashboard-graph";
import { DataTable } from "~/components/data-table";
import { ExportLoadingSessionsButton } from "~/components/export-loading-sessions-button";
import { LoadingButton } from "~/components/ui/button";
import {
  formatCurrency,
  formatDuration,
  formatPercentage,
  formatUnit,
} from "~/lib/utils";
import { orpc } from "~/orpc/client";
import { getSessionRangeUrl } from "~/orpc/loadingSessions/helpers";

export function ExtractedSessions({
  instanceId,
  className,
}: {
  instanceId: string;
  className?: string;
}) {
  const queryClient = useQueryClient();

  const invalidateExtractedSessions = () =>
    void queryClient.invalidateQueries({
      queryKey: orpc.loadingSessions.getExtractedSessions.queryKey({
        input: { instanceIds: [instanceId] },
      }),
    });
  const extractedSessions = useSuspenseQuery(
    orpc.loadingSessions.getExtractedSessions.queryOptions({
      input: { instanceIds: [instanceId] },
    }),
  );

  const triggerExtraction = useMutation(
    orpc.jobs.extractAndSaveSessions.mutationOptions({
      onSuccess: invalidateExtractedSessions,
    }),
  );

  const deleteExtractedSessions = useMutation(
    orpc.loadingSessions.deleteExtractedSessions.mutationOptions({
      onSuccess: invalidateExtractedSessions,
    }),
  );

  return (
    <ExpandableDashboardGraph
      title="Extracted Sessions"
      expandKey="extracted-sessions"
      dialogClassName="w-full lg:max-w-[90vw]"
      mainContent={
        <div className="flex flex-row items-center justify-between">
          {extractedSessions.data.length} Session
          {extractedSessions.data.length > 1 ? "s" : ""}
        </div>
      }
      className={className}
      expandContent={
        <div className="flex w-full flex-col gap-2 overflow-x-auto">
          <div className="flex flex-row items-center justify-end gap-2">
            <LoadingButton
              variant="outline"
              size="icon"
              onClick={() =>
                triggerExtraction.mutateAsync({ instanceIds: [instanceId] })
              }
              icon={<RefreshCcwIcon className="h-4 w-4" />}
            />
            <LoadingButton
              variant="outline"
              size="icon"
              onClick={() =>
                deleteExtractedSessions.mutateAsync({
                  instanceIds: [instanceId],
                })
              }
              icon={<TrashIcon className="h-4 w-4" />}
            />
            <ExportLoadingSessionsButton data={extractedSessions.data} />
          </div>

          <DataTable
            data={extractedSessions.data}
            onRowDoubleClick={(row) => {
              window.open(getSessionRangeUrl(row), "_blank");
            }}
            columns={[
              {
                accessorKey: "startTime",
                header: "Start",
                cell: ({ row }) =>
                  formatDate(row.original.startTime, "dd MMM yyyy - HH:mm:ss"),
              },
              {
                accessorKey: "endTime",
                header: "End",
                cell: ({ row }) =>
                  formatDate(row.original.endTime, "dd MMM yyyy - HH:mm:ss"),
              },
              {
                accessorFn: (row) => formatDuration(row.duration),
                header: "Active Duration",
              },
              {
                accessorFn: (row) =>
                  formatDuration(
                    differenceInSeconds(row.endTime, row.startTime),
                  ),
                header: "Total Duration",
              },
              { accessorKey: "componentId", header: "Component" },
              {
                accessorKey: "price",
                header: "Price",
                cell: ({ row }) => formatCurrency(row.original.price, "EUR"),
              },
              {
                accessorKey: "solarPercentage",
                header: "Solar",
                cell: ({ row }) =>
                  formatPercentage(row.original.solarPercentage),
              },
              {
                accessorKey: "maxChargePower",
                header: "Max Charge Power",
                cell: ({ row }) =>
                  formatUnit(row.original.maxChargePower, "W", 2, true),
              },
              { accessorKey: "maxPhasesActive", header: "Max Phases Active" },
              {
                accessorKey: "startSoc",
                header: "Start SoC",
                cell: ({ row }) => formatPercentage(row.original.startSoc),
              },
              {
                accessorKey: "endSoc",
                header: "End SoC",
                cell: ({ row }) => formatPercentage(row.original.endSoc),
              },
              {
                accessorKey: "startRange",
                header: "Start Range",
                cell: ({ row }) => formatUnit(row.original.startRange, "km", 2),
              },
              {
                accessorKey: "endRange",
                header: "End Range",
                cell: ({ row }) => formatUnit(row.original.endRange, "km", 2),
              },
              {
                accessorKey: "limitSoc",
                header: "Limit SoC",
                cell: ({ row }) => formatPercentage(row.original.limitSoc),
              },
              {
                accessorKey: "chargedEnergy",
                header: "Charged Energy",
                cell: ({ row }) =>
                  formatUnit(row.original.chargedEnergy, "Wh", 1, true),
              },
              {
                accessorKey: "sessionEnergy",
                header: "Session Energy",
                cell: ({ row }) =>
                  formatUnit(row.original.sessionEnergy, "Wh", 2, true),
              },
            ]}
          />
        </div>
      }
    />
  );
}
