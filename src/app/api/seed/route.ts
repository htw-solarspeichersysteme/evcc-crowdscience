import { sql } from "drizzle-orm";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";

export async function GET() {
  const exampleUsers = [
    {
      email: "moin@moin.com",
      password: "password1",
      isAdmin: true,
    },
    {
      email: "test@test.com",
      password: "password2",
      isAdmin: false,
    },
  ];

  await db
    .insert(users)
    .values(
      exampleUsers.map((user) => ({
        ...user,
        // TODO @Pichi11: use a password salting + hashing function here
        // create it in a different file, maybe
        passwordHash: user.password,
      })),
    )
    .onConflictDoUpdate({
      target: [users.email],
      set: {
        isAdmin: sql`excluded.is_admin`,
        passwordHash: sql`excluded.password_hash`,
      },
    });
  return Response.json(db.select().from(users).all());
}
