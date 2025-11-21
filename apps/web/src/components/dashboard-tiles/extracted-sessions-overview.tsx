import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { differenceInSeconds } from "date-fns";
import { RefreshCcwIcon, TrashIcon } from "lucide-react";

import { ExpandableDashboardGraph } from "~/components/dashboard-graph";
import { DataTable } from "~/components/data-table";
import { ExportLoadingSessionsButton } from "~/components/export-loading-sessions-button";
import { LoadingButton } from "~/components/ui/button";
import { formatSecondsInHHMM } from "~/lib/utils";
import { orpc } from "~/orpc/client";
import { loadingSessionApi } from "~/serverHandlers/loadingSession/serverFns";

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

  const triggerExtraction = loadingSessionApi.extractSessions.useMutation({
    onSuccess: invalidateExtractedSessions,
  });

  const deleteExtractedSessions =
    loadingSessionApi.deleteExtractedSessions.useMutation({
      onSuccess: invalidateExtractedSessions,
    });

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
                triggerExtraction.mutateAsync({ data: { instanceId } })
              }
              icon={<RefreshCcwIcon className="h-4 w-4" />}
            />
            <LoadingButton
              variant="outline"
              size="icon"
              onClick={() =>
                deleteExtractedSessions.mutateAsync({
                  data: { instanceIds: [instanceId] },
                })
              }
              icon={<TrashIcon className="h-4 w-4" />}
            />
            <ExportLoadingSessionsButton data={extractedSessions.data} />
          </div>

          <DataTable
            data={extractedSessions.data}
            columns={[
              { accessorKey: "startTime", header: "Start" },
              { accessorKey: "endTime", header: "End" },
              {
                accessorFn: (row) => {
                  const difference = differenceInSeconds(
                    row.endTime,
                    row.startTime,
                  );

                  return formatSecondsInHHMM(difference);
                },
                header: "Total Duration",
              },
              {
                accessorFn: (row) => {
                  return formatSecondsInHHMM(row.duration);
                },
                header: "Active Duration",
              },
              { accessorKey: "componentId", header: "Component" },
              { accessorKey: "price", header: "Price" },
              { accessorKey: "solarPercentage", header: "Solar" },
              { accessorKey: "maxChargePower", header: "Max Charge Power" },
              { accessorKey: "maxPhasesActive", header: "Max Phases Active" },
              { accessorKey: "startSoc", header: "Start SoC" },
              { accessorKey: "endSoc", header: "End SoC" },
              { accessorKey: "startRange", header: "Start Range" },
              { accessorKey: "endRange", header: "End Range" },
              { accessorKey: "limitSoc", header: "Limit SoC" },
              { accessorKey: "chargedEnergy", header: "Charged Energy" },
              { accessorKey: "sessionEnergy", header: "Session Energy" },
            ]}
          />
        </div>
      }
    />
  );
}
