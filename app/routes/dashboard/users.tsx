import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { MoreHorizontalIcon } from "lucide-react";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { UserDialog } from "~/components/user-dialog";
import { toast } from "~/hooks/use-toast";
import { deleteUser, userQueries } from "~/serverHandlers/user";

export const Route = createFileRoute("/dashboard/users")({
  component: RouteComponent,
  staticData: {
    routeTitle: "Users",
  },
  validateSearch: zodValidator(
    z
      .object({
        action: z.literal("edit"),
        userId: z.string().uuid(),
      })
      .or(
        z.object({
          action: z.literal("create").optional(),
        }),
      ),
  ),
  loaderDeps: ({ search }) => ({
    search,
  }),
  loader: async ({ context, deps }) => {
    const promises = [];
    if (deps.search.action === "edit") {
      promises.push(
        context.queryClient.prefetchQuery(
          userQueries.get({ id: deps.search.userId }),
        ),
      );
    }
    promises.push(context.queryClient.prefetchQuery(userQueries.getMultiple()));
    await Promise.allSettled(promises);
  },
  wrapInSuspense: true,
});

function RouteComponent() {
  const { data: users } = useSuspenseQuery(userQueries.getMultiple());
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
  });
  const queryClient = useQueryClient();

  return (
    <>
      <UserDialog />
      <Table className="overflow-x-auto mb-4">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>E-Mail</TableHead>
            <TableHead>Role</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.isAdmin ? "Admin" : "User"}</TableCell>
              <TableCell className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                    >
                      <MoreHorizontalIcon />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem asChild>
                      <Link to="." search={{ action: "edit", userId: user.id }}>
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        await deleteUserMutation.mutateAsync({
                          data: { id: user.id },
                        });
                        void queryClient.invalidateQueries({
                          queryKey: ["user"],
                        });

                        toast({
                          title: "User deleted",
                          description: "User has been deleted",
                        });
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-end">
        <Button asChild>
          <Link to="." search={{ action: "create" }}>
            Create User
          </Link>
        </Button>
      </div>
    </>
  );
}
