import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { MoreHorizontalIcon } from "lucide-react";
import { z } from "zod";

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
import { deleteUser, undoDeleteUser, userApi } from "~/serverHandlers/user";

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
          userApi.get.getOptions({
            data: { id: deps.search.userId },
          }),
        ),
      );
    }
    promises.push(
      context.queryClient.prefetchQuery(
        userApi.getMultiple.getOptions({
          data: {},
        }),
      ),
    );
    await Promise.allSettled(promises);
  },
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { data: users } = userApi.getMultiple.useSuspenseQuery({
    variables: { data: {} },
  });

  const { session } = useAuth();
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
  });
  const queryClient = useQueryClient();

  return (
    <>
      <UserDialog />
      <DataTable
        data={users}
        onRowDoubleClick={(row) => {
          void navigate({
            to: ".",
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
              session?.user.isAdmin || session?.user.id === row.original.id ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex h-8 w-8 p-0 data-[state=open]:bg-muted ml-auto"
                    >
                      <MoreHorizontalIcon />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem asChild>
                      <Link
                        to="."
                        search={{ action: "edit", userId: row.original.id }}
                      >
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    {session?.user.isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="hover:!bg-destructive hover:!text-destructive-foreground"
                          onClick={async () => {
                            await deleteUserMutation.mutateAsync({
                              data: { id: row.original.id },
                            });
                            void queryClient.invalidateQueries({
                              queryKey: ["user"],
                            });

                            toast({
                              title: "User deleted",
                              description: "User has been deleted",

                              action: (
                                <ToastAction
                                  altText="Undo"
                                  onClick={async () => {
                                    await undoDeleteUser({
                                      data: { id: row.original.id },
                                    });
                                    void queryClient.invalidateQueries({
                                      queryKey: ["user"],
                                    });
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
            <Link to="." search={{ action: "create" }}>
              Create User
            </Link>
          </Button>
        </div>
      </DataTable>
    </>
  );
}
