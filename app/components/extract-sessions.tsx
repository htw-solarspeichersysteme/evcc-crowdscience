import { differenceInMinutes } from "date-fns";

import { loadingSessionsApi } from "~/serverHandlers/loadingSession";
import { DataTable } from "./data-table";
import { LoadingButton } from "./ui/button";

export function ExtractSessions({
  instanceId,
  className,
}: {
  instanceId: string;
  className?: string;
}) {
  const extractSessionsMutation =
    loadingSessionsApi.extractSessions.useMutation({});

  return (
    <div className={className}>
      <LoadingButton
        onClick={async () => {
          await extractSessionsMutation.mutateAsync({ data: { instanceId } });
        }}
      >
        extract sessions
      </LoadingButton>
      {extractSessionsMutation.data && (
        <DataTable
          data={extractSessionsMutation.data}
          columns={[
            { accessorKey: "start", header: "Start" },
            { accessorKey: "end", header: "End" },
            {
              accessorFn: (row) => {
                const difference = differenceInMinutes(row.end, row.start);

                // format as HH:MM
                return `${Math.floor(difference / 60)
                  .toString()
                  .padStart(
                    2,
                    "0",
                  )}:${(difference % 60).toString().padStart(2, "0")}`;
              },
              header: "Duration",
            },
            { accessorKey: "componentId", header: "Component" },
          ]}
        />
      )}
    </div>
  );
}
