import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PageTitle } from "~/components/ui/typography";
import { api } from "~/trpc/server";

export default async function UsersPage() {
  const users = await api.user.getAll();

  return (
    <div>
      <PageTitle>Users</PageTitle>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>E-Mail</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.isAdmin ? "Admin" : "User"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </div>
  );
}
