import { sql } from "drizzle-orm";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";

import {hashPassword} from "~/app/api/auth/[...nextauth]/password";

export async function GET() {
  const exampleUsers = [
    {
      firstName: "Moin",
      lastName: "Moin Moin",
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
      await Promise.all(
        exampleUsers.map(async (user) => ({
          ...user,
          // TODO @Pichi11: use a password salting + hashing function here
          // create it in a different file, maybe
          passwordHash: await hashPassword(user.password),
        })),
      )
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
