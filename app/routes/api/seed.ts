import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";

import { sqliteDb } from "~/db/client";
import { users } from "~/db/schema";
import { hashPassword } from "~/serverHandlers/userSession";

export const APIRoute = createAPIFileRoute("/api/seed")({
  GET: async () => {
    const uniqueId = crypto.randomUUID();
    const email = `${uniqueId.slice(0, 8)}@test.com`;
    const password = uniqueId.slice(8, 20);
    await sqliteDb.insert(users).values({
      passwordHash: await hashPassword(password),
      email,
      firstName: "Test",
      lastName: "User",
      isAdmin: true,
    });

    return json({
      email,
      password,
    });
  },
});
