import { createFileRoute, Link } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { instanceApi } from "~/serverHandlers/instance";

export const Route = createFileRoute("/dashboard/instances/")({
  component: RouteComponent,
  staticData: {
    routeTitle: "Instances",
  },
  wrapInSuspense: true,
});

function RouteComponent() {
  const { data: instances } = instanceApi.getActiveInstances.useSuspenseQuery();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Instance</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {instances.map((instance) => (
          <TableRow key={instance}>
            <TableCell>{instance}</TableCell>
            <TableCell>
              <Button variant="outline" size="icon" asChild>
                <Link
                  to={"/dashboard/instances/$instanceId"}
                  params={{ instanceId: instance }}
                >
                  <EyeIcon className="size-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
