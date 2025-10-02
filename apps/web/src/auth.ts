import { queryOptions, useQuery } from "@tanstack/react-query";
import { redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { sqliteDb } from "~/db/client";
import { users } from "~/db/schema";
import {
  useServerSideAppSession,
  verifyPassword,
  type DefaultContext,
} from "~/lib/session";

export const getClientSession = createServerFn().handler(async () => {
  const session = await useServerSideAppSession();
  return session.data;
});

export const validateBasicAuth = createServerFn()
  .inputValidator(
    z.object({ role: z.enum(["user", "admin"]) }).default({ role: "user" }),
  )
  .handler(async ({ data }) => {
    const [type, token] = getRequestHeader("Authorization")?.split(" ") ?? [];
    if (type !== "Basic" || !token) return false;

    const decodedToken = Buffer.from(token, "base64").toString("utf-8");
    const [username, password] = decodedToken.split(":");

    const user = await sqliteDb.query.users.findFirst({
      where: eq(users.email, username),
    });

    // user not found or password is incorrect
    if (!user || !(await verifyPassword(password, user.passwordHash)))
      return false;

    // user is not admin but must be
    if (data.role === "admin" && !user.isAdmin) return false;

    return true;
  });

export const sessionQueryOptions = queryOptions({
  queryKey: ["clientSession"],
  queryFn: () => getClientSession(),
});

export const useAuth = () => {
  const sessionQuery = useQuery(sessionQueryOptions);
  const router = useRouter();

  return {
    session: sessionQuery.data,
    logout: async () => {
      await logoutFn();

      await sessionQuery.refetch();
      await router.invalidate();
    },
    login: async (data: z.infer<typeof loginInputSchema>) => {
      const res = await loginFn({ data });
      if (!res.success) return res;

      await sessionQuery.refetch();
      if (data.redirect) await router.navigate({ href: data.redirect });
      else await router.invalidate();
    },
  };
};

export const protectRoute = ({
  context,
  location,
}: {
  context: DefaultContext;
  location: { href: string };
}) => {
  if (!context.session?.user) {
    throw redirect({
      to: "/login",
      search: {
        redirect: location.href,
      },
    });
  }
};

export const loginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  redirect: z.string().optional(),
});
export const loginFn = createServerFn()
  .inputValidator(loginInputSchema)
  .handler(async ({ data }) => {
    const session = await useServerSideAppSession();

    const userInDb = await sqliteDb.query.users.findFirst({
      where: eq(users.email, data.username),
    });

    if (
      userInDb &&
      (await verifyPassword(data.password, userInDb.passwordHash))
    ) {
      await session.update({
        user: {
          id: userInDb.id,
          firstName: userInDb.firstName,
          lastName: userInDb.lastName,
          email: userInDb.email,
          isAdmin: userInDb.isAdmin,
        },
      });
      return {
        success: true,
      } as const;
    }

    return {
      success: false,
      error: "Invalid username or password",
    } as const;
  });

export const logoutFn = createServerFn().handler(async () => {
  const session = await useServerSideAppSession();
  await session.clear();
});
