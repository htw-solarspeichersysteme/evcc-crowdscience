import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { MoreHorizontalIcon } from "lucide-react";
import { z } from "zod";

import { DataTable } from "~/components/data-table";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { UserDialog } from "~/components/user-dialog";
import { toast } from "~/hooks/use-toast";
import { deleteUser, userApi } from "~/serverHandlers/user";

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
  const { data: users } = userApi.getMultiple.useSuspenseQuery({
    variables: { data: {} },
  });
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
  });
  const queryClient = useQueryClient();

  return (
    <>
      <UserDialog />
      <DataTable
        data={users}
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
            cell: ({ row }) => (
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
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
                      });
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
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
