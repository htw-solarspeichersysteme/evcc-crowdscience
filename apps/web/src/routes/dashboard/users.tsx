import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MoreHorizontalIcon } from "lucide-react";
import * as z from "zod";

import { useAuth } from "~/auth";
import { DataTable } from "~/components/data-table";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ToastAction } from "~/components/ui/toast";
import { UserDialog } from "~/components/user-dialog";
import { toast } from "~/hooks/use-toast";
import { orpc } from "~/orpc/client";

export const Route = createFileRoute("/dashboard/users")({
  component: RouteComponent,
  validateSearch: z
    .object({
      action: z.literal("edit"),
      userId: z.uuid(),
    })
    .or(
      z.object({
        action: z.literal("create").optional(),
      }),
    ),
  loaderDeps: ({ search }) => ({
    search,
  }),
  beforeLoad: () => ({ routeTitle: "Users" }),
  loader: async ({ context, deps }) => {
    const promises = [];
    if (deps.search.action === "edit") {
      promises.push(
        context.queryClient.ensureQueryData(
          orpc.users.get.queryOptions({
            input: { id: deps.search.userId, mode: "id" },
          }),
        ),
      );
    }
    promises.push(
      context.queryClient.ensureQueryData(
        orpc.users.getMultiple.queryOptions({
          input: {},
        }),
      ),
    );
    await Promise.allSettled(promises);
  },
});

function RouteComponent() {
  const navigate = Route.useNavigate();

  const deleteUser = useMutation(orpc.users.delete.mutationOptions());
  const undoDeleteUser = useMutation(orpc.users.undoDelete.mutationOptions());
  const { data: users } = useSuspenseQuery(
    orpc.users.getMultiple.queryOptions({
      input: {},
    }),
  );

  const { session } = useAuth();

  const invalidateUsers = () =>
    queryClient.invalidateQueries({
      queryKey: orpc.users.getMultiple.queryKey(),
    });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => deleteUser.mutateAsync({ id }),
    onSettled: invalidateUsers,
  });
  const queryClient = useQueryClient();

  const undoDeleteUserMutation = useMutation({
    mutationFn: (id: string) => undoDeleteUser.mutateAsync({ id }),
    onSettled: invalidateUsers,
  });

  return (
    <>
      <UserDialog />
      <DataTable
        data={users}
        onRowDoubleClick={(row) => {
          void navigate({
            to: ".",
            replace: true,
            search: { action: "edit", userId: row.id },
          });
        }}
        columns={[
          {
            accessorFn: (row) => `${row.firstName} ${row.lastName}`,
            header: "Name",
          },
          {
            accessorKey: "email",
            header: "E-Mail",
          },
          {
            accessorKey: "isAdmin",
            header: "Role",
            cell: ({ row }) => (row.original.isAdmin ? "Admin" : "User"),
          },
          {
            id: "actions",
            cell: ({ row }) =>
              session?.user?.isAdmin ||
              session?.user?.id === row.original.id ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="ml-auto flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                    >
                      <MoreHorizontalIcon />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem asChild>
                      <Link
                        to="."
                        replace
                        search={{ action: "edit", userId: row.original.id }}
                      >
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    {session?.user.isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="hover:bg-destructive! hover:text-white!"
                          onClick={async () => {
                            await deleteUserMutation.mutateAsync(
                              row.original.id,
                            );

                            toast({
                              title: "User deleted",
                              description: "User has been deleted",
                              action: (
                                <ToastAction
                                  altText="Undo"
                                  onClick={() => {
                                    void undoDeleteUserMutation.mutateAsync(
                                      row.original.id,
                                    );
                                  }}
                                >
                                  Undo
                                </ToastAction>
                              ),
                            });
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null,
          },
        ]}
      >
        <div className="flex justify-end">
          <Button asChild>
            <Link to="." replace search={{ action: "create" }}>
              Create User
            </Link>
          </Button>
        </div>
      </DataTable>
    </>
  );
}
