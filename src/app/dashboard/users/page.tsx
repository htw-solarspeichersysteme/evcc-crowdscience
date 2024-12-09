"use client";

import { Suspense } from "react";
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
import { PageTitle } from "~/components/ui/typography";
import { api } from "~/trpc/react";

export const dynamic = "force-dynamic";

export default function UsersPage() {
  const [users, usersQuery] = api.user.getAll.useSuspenseQuery();

  const deleteUserMutation = api.user.delete.useMutation({
    onSuccess: () => {
      void usersQuery.refetch();
    },
  });

  return (
    <div>
      <PageTitle>Users</PageTitle>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>E-Mail</TableHead>
            <TableHead>Role</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <Suspense fallback={<div>Loading...</div>}>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.isAdmin ? "Admin" : "User"}</TableCell>
                <TableCell>
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
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => {
                          console.log("delete user", user.id);

                          deleteUserMutation.mutate({ id: user.id });
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
        </Suspense>
      </Table>
      <div className="flex justify-end">
        <Button>Create User</Button>
      </div>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </div>
  );
}
