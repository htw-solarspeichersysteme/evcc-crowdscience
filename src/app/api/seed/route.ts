import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { api } from "~/trpc/server";

export async function GET() {
  const exampleUsers = [
    {
      id: null,
      firstName: "Moin",
      lastName: "Moin",
      email: "moin@moin.com",
      password: "password1",
      isAdmin: true,
    },
    {
      id: null,
      firstName: "vorname",
      lastName: "nachname",
      email: "test@test.com",
      password: "password2",
      isAdmin: false,
    },
  ];

  const promises = exampleUsers.map((user) => {
    return api.user.create(user);
  });

  await Promise.allSettled(promises);

  return Response.json(db.select().from(users).all());
}
