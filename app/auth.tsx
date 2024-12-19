import { queryOptions, useQuery } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  useServerSideAppSession,
  verifyPassword,
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

  return {
    session: sessionQuery.data,
    logout: useServerFn(logoutFn),
    login: useServerFn(loginFn),
  };
};

export const loginFn = createServerFn()
  .validator(
    zodValidator(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
        redirect: z.string().optional(),
      }),
    ),
  )
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
      throw redirect({
        to: data.redirect ?? "/",
        search: { sessionChanged: true },
      });
    }

    return {
      error: "Invalid username or password",
    };
  });

export const logoutFn = createServerFn().handler(async () => {
  const session = await useServerSideAppSession();
  await session.clear();

  throw redirect({ to: "/", search: { sessionChanged: true } });
});

export const protectRoute = async ({
  context,
  location,
}: {
  context: { session?: { user: { id: string } } };
  location: { href: string };
}) => {
  if (!context?.session?.user) {
    throw redirect({
      to: "/login",
      search: {
        redirect: location.href,
      },
    });
  }
};
