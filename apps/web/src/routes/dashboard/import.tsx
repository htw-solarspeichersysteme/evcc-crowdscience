import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { differenceInSeconds, formatDate } from "date-fns";
import type { InferSelectModel } from "drizzle-orm";
import z from "zod";

import { DataTable } from "~/components/data-table";
import { LoadingButton } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { csvImportLoadingSessions } from "~/db/schema";
import { formatSecondsInHHMM } from "~/lib/utils";
import { orpc } from "~/orpc/client";

export const Route = createFileRoute("/dashboard/import")({
  component: RouteComponent,
  staticData: {
    routeTitle: "Import",
  },
  validateSearch: z.object({
    instanceId: z.string().optional(),
  }),
});

function RouteComponent() {
  const queryClient = useQueryClient();

  const { instanceId } = Route.useSearch();
  const importFileMutation = useMutation(
    orpc.loadingSessions.importSessions.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: orpc.loadingSessions.getImportedSessions.queryKey({
            input: {},
          }),
        });
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const csvFile = formData.get("csvFile") as File | null;
    const instanceId = formData.get("instanceId") as string | null;

    if (!csvFile || !instanceId) {
      return;
    }

    importFileMutation.mutate({ csvFile, instanceId });
  };

  return (
    <div className="space-y-4">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input type="file" name="csvFile" accept=".csv" required />
        <Input
          type="text"
          name="instanceId"
          placeholder="Instance ID"
          defaultValue={instanceId}
          required
        />
        <LoadingButton
          type="submit"
          className="ml-auto"
          loading={importFileMutation.isPending}
        >
          Import
        </LoadingButton>
      </form>
      {importFileMutation.data && (
        <ImportedSessionsTable importedSessions={importFileMutation.data} />
      )}
    </div>
  );
}

export function ImportedSessionsTable({
  importedSessions,
}: {
  importedSessions: InferSelectModel<typeof csvImportLoadingSessions>[];
}) {
  return (
    <DataTable
      columns={[
        {
          accessorKey: "loadpoint",
          header: "Loadpoint",
        },
        {
          accessorKey: "vehicle",
          header: "Vehicle",
        },
        {
          accessorKey: "kilometer",
          header: "Kilometer",
        },
        {
          accessorKey: "startKwh",
          header: "Start KWh",
        },
        {
          accessorKey: "endKwh",
          header: "End KWh",
        },
        {
          accessorKey: "energy",
          header: "Energy",
        },
        {
          accessorFn: (row) => {
            const difference = differenceInSeconds(row.endTime, row.startTime);

            return formatSecondsInHHMM(difference);
          },
          header: "Total Duration",
        },
        {
          accessorFn: (row) =>
            row.duration ? formatSecondsInHHMM(row.duration) : null,
          header: "Charging Duration",
        },
        {
          accessorFn: (row) =>
            formatDate(row.startTime, "dd MMM yyyy HH:mm:ss"),
          header: "Start Time",
        },
        {
          accessorFn: (row) => formatDate(row.endTime, "dd MMM yyyy HH:mm:ss"),
          header: "End Time",
        },
      ]}
      data={importedSessions}
    />
  );
}
