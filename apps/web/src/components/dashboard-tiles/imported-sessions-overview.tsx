import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { TrashIcon } from "lucide-react";

import { ExpandableDashboardGraph } from "~/components/dashboard-graph";
import { ImportedSessionsTable } from "~/routes/dashboard/import";
import { loadingSessionApi } from "~/serverHandlers/loadingSession/serverFns";
import { Button, LoadingButton } from "../ui/button";

export function ImportedSessions({
  instanceId,
  className,
}: {
  instanceId: string;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const importedSessions =
    loadingSessionApi.getImportedSessions.useSuspenseQuery({
      variables: { data: { instanceIds: [instanceId] } },
    });
  const deleteImportedSessions =
    loadingSessionApi.deleteImportedSessions.useMutation({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: loadingSessionApi.getImportedSessions.getKey(),
        });
      },
    });

  return (
    <ExpandableDashboardGraph
      title="Imported Sessions (CSV)"
      expandKey="imported-sessions"
      dialogClassName="w-full lg:max-w-[90vw]"
      mainContent={
        <div className="flex flex-row items-center justify-between">
          {importedSessions.data.length} Session
          {importedSessions.data.length > 1 ? "s" : ""}
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
                deleteImportedSessions.mutateAsync({
                  data: { instanceIds: [instanceId] },
                })
              }
              icon={<TrashIcon className="h-4 w-4" />}
            />
            <Button asChild>
              <Link to="/dashboard/import">Import Sessions</Link>
            </Button>
          </div>

          <ImportedSessionsTable importedSessions={importedSessions.data} />
        </div>
      }
    />
  );
}
