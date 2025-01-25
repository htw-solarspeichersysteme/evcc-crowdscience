import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";
import { eq } from "drizzle-orm/expressions";

import { sqliteDb } from "~/db/client";
import {
  csvImportLoadingSessions,
  extractedLoadingSessions,
  users,
} from "~/db/schema";
import { verifyPassword } from "~/serverHandlers/userSession";

const validateBasicAuth = async (request: Request) => {
  const [type, token] = request.headers.get("Authorization")?.split(" ") ?? [];
  if (type !== "Basic" || !token) return false;

  const decodedToken = Buffer.from(token, "base64").toString("utf-8");
  const [username, password] = decodedToken.split(":");

  const user = await sqliteDb.query.users.findFirst({
    where: eq(users.email, username),
  });
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return false;

  return true;
};

export const APIRoute = createAPIFileRoute(
  "/api/instance/$instanceId/sessions",
)({
  POST: async ({ request, params }) => {
    if (!(await validateBasicAuth(request))) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const extractedSessions =
      await sqliteDb.query.extractedLoadingSessions.findMany({
        where: eq(extractedLoadingSessions.instanceId, params.instanceId),
      });

    const csvImportSessions =
      await sqliteDb.query.csvImportLoadingSessions.findMany({
        where: eq(csvImportLoadingSessions.instanceId, params.instanceId),
      });

    return json({ extractedSessions, csvImportSessions });
  },
});
