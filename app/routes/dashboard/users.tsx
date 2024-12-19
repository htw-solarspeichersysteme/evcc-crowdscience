import { useState } from "react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontalIcon } from "lucide-react";

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
import { UserDialog, type DialogUser } from "~/components/user-dialog";
import { toast } from "~/hooks/use-toast";
import { deleteUser, userQueries } from "~/serverHandlers/user";

export const Route = createFileRoute("/dashboard/users")({
  component: RouteComponent,
  staticData: {
    routeTitle: "Users",
  },
  wrapInSuspense: true,
});

function RouteComponent() {
  const { data: users } = useSuspenseQuery(userQueries.getMultiple({}));
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
  });
  const [dialogUser, setDialogUser] = useState<DialogUser | null>(null);
  const queryClient = useQueryClient();

  return (
    <>
      <UserDialog
        onOpenChange={(state) => state || setDialogUser(null)}
        user={dialogUser}
      />
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
                    <DropdownMenuItem onClick={() => setDialogUser(user)}>
                      Edit
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
        <Button
          onClick={() =>
            setDialogUser({
              id: null,
              firstName: "",
              lastName: "",
              email: "",
              isAdmin: false,
            })
          }
        >
          Create User
        </Button>
      </div>
    </>
  );
}
