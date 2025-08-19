import { eq } from "drizzle-orm";

import { sqliteDb } from "~/db/client";
import { users } from "~/db/schema";
import { verifyPassword } from "~/lib/session";

export async function validateBasicAuth(request: Request) {
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
}
