import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, type MakeRouteMatch } from "@tanstack/react-router";
import { format } from "date-fns";

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
    <div>
      <div>overview of instance "{instanceId}"</div>
      <LoadingButton
        loading={extractSessionsMutation.isPending}
        onClick={() => extractSessionsMutation.mutate()}
      >
        extract sessions
      </LoadingButton>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Component</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {extractedSessions.map((session) => (
            <TableRow
              key={session.start.toISOString() + session.end.toISOString()}
            >
              <TableCell>{format(session.start, "yyyy-MM-dd HH:mm")}</TableCell>
              <TableCell>{format(session.end, "yyyy-MM-dd HH:mm")}</TableCell>
              <TableCell>{session.componentId}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
