"use server";

import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { eq } from "drizzle-orm";
import { useSession } from "vinxi/http";
import { z } from "zod";

import { sqliteDb } from "~/db/client";
import { users } from "~/db/schema";
import { env } from "~/env";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
};

export type Session = {
  user: SessionUser;
};

export async function hashPassword(password: string) {
  return await Bun.password.hash(password);
}

export async function verifyPassword(password: string, hash: string) {
  return await Bun.password.verify(password, hash);
}

export function useServerSideAppSession() {
  return useSession<Session>({
    password: env.AUTH_SECRET,
  });
}
export const getClientSession = createServerFn().handler(async () => {
  const session = await useServerSideAppSession();
  return session.data;
});

export const loginInputSchema = z.object({
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
