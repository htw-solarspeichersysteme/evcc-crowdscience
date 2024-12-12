"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontalIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { toast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";
import { UserDialog, type DialogUser } from "./user-dialog";

export default function UsersPage() {
  const utils = api.useUtils();
  const [users] = api.user.getAll.useSuspenseQuery(undefined, {});
  const [dialogUser, setDialogUser] = useState<DialogUser | null>(null);

  const deleteUserMutation = api.user.delete.useMutation({});

  return (
    <>
      <UserDialog
        onOpenChange={(state) => state || setDialogUser(null)}
        user={dialogUser}
      />

      <Table className="overflow-x-auto">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>E-Mail</TableHead>
            <TableHead>Role</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
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
                        await deleteUserMutation.mutateAsync({ id: user.id });
                        void utils.user.invalidate();
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
