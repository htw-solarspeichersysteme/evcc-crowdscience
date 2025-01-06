import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, type MakeRouteMatch } from "@tanstack/react-router";
import { format } from "date-fns";

import { DataTable } from "~/components/data-table";
import { LoadingButton } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  extractSessions,
  type ExtractedLoadingSessions,
} from "~/serverHandlers/loadingSessions";

export const Route = createFileRoute("/dashboard/instances/$instanceId")({
  component: RouteComponent,
  staticData: {
    routeTitle: (r: MakeRouteMatch<typeof Route>) => {
      return `${r.params.instanceId}`;
    },
  },
});

function RouteComponent() {
  const { instanceId } = Route.useParams();
  const [extractedSessions, setExtractedSessions] = useState<
    ExtractedLoadingSessions["string"]
  >([]);

  const extractSessionsMutation = useMutation({
    mutationFn: () => extractSessions({ data: {} }),
    onSuccess: (res) => {
      setExtractedSessions(res?.[instanceId] ?? []);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div>overview of instance "{instanceId}"</div>
      <LoadingButton
        loading={extractSessionsMutation.isPending}
        onClick={() => extractSessionsMutation.mutate()}
      >
        extract sessions
      </LoadingButton>
      <DataTable
        data={extractedSessions}
        columns={[
          { accessorKey: "start", header: "Start" },
          { accessorKey: "end", header: "End" },
          { accessorKey: "componentId", header: "Component" },
        ]}
      />
    </div>
  );
}
