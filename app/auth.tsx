import { queryOptions, useQuery } from "@tanstack/react-query";
import { redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  useServerSideAppSession,
  verifyPassword,
  type Session,
} from "~/serverHandlers/session";
import { sqliteDb } from "./db/client";
import { users } from "./db/schema";

export const getClientSession = createServerFn().handler(async () => {
  const session = await useServerSideAppSession();
  return session.data;
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
      await router.navigate({
        to: "/",
      });
    },
    login: async (data: z.infer<typeof loginInputSchema>) => {
      const res = await loginFn({ data });
      if (!res.success) return res;
      await sessionQuery.refetch();
      await router.navigate({
        to: data.redirect ?? "/dashboard",
      });
    },
  };
};

const loginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  redirect: z.string().optional(),
});
export const loginFn = createServerFn()
  .validator(zodValidator(loginInputSchema))
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

export const protectRoute = async ({
  context,
  location,
}: {
  context: { session?: Session };
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
