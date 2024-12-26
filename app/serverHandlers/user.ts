import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";

import { sqliteDb } from "~/db/client";
import { users } from "~/db/schema";
import { adminFnMiddleware, protectedFnMiddleware } from "~/globalMiddleware";
import { hashPassword } from "./userSession";

/**
 * Queries
 */
export const userQueries = {
  get: (input: z.input<typeof getUserInputSchema>) =>
    queryOptions({
      queryKey: ["user", "get", { input }],
      queryFn: () => getUser({ data: input }),
    }),
  getMultiple: (input?: z.input<typeof getMultipleUsersInputSchema>) =>
    queryOptions({
      queryKey: ["user", "getMultiple", input?.ids],
      queryFn: () => getMultipleUsers({ data: input }),
    }),
};

const userColumns = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isAdmin: true,
} as const;

const getMultipleUsersInputSchema = z
  .object({ ids: z.array(z.string()).optional() })
  .optional();
const getMultipleUsers = createServerFn()
  .middleware([protectedFnMiddleware])
  .validator(zodValidator(getMultipleUsersInputSchema))
  .handler(async ({ data }) => {
    return await sqliteDb.query.users.findMany({
      where: and(
        isNull(users.deletedAt),
        data?.ids ? inArray(users.id, data.ids) : undefined,
      ),
      columns: userColumns,
    });
  });

const getUserInputSchema = z
  .object({
    email: z.string().email(),
    mode: z.literal("email").default("email"),
  })
  .or(z.object({ id: z.string(), mode: z.literal("id").default("id") }));
export const getUser = createServerFn()
  .middleware([protectedFnMiddleware])
  .validator(zodValidator(getUserInputSchema))
  .handler(async ({ data }) => {
    const user = await sqliteDb.query.users.findFirst({
      where: and(
        isNull(users.deletedAt),
        data.mode === "email"
          ? eq(users.email, data.email)
          : eq(users.id, data.id),
      ),
      columns: userColumns,
    });

    return user;
  });

const checkUserExists = createServerFn()
  .middleware([protectedFnMiddleware])
  .validator(
    zodValidator(
      z.object({
        email: z.string().email(),
      }),
    ),
  )
  .handler(async ({ data }) => {
    const user = await sqliteDb.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    const isActiveUser = user && !user.deletedAt;
    return { user, isActiveUser };
  });

/**
 * Mutations
 */
const updateUserInputSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  isAdmin: z.boolean(),
  password: z.string().nullable(),
  deletedAt: z.date().nullable().optional(),
});
export const updateUser = createServerFn({ method: "POST" })
  .middleware([adminFnMiddleware])
  .validator(zodValidator(updateUserInputSchema))
  .handler(async ({ data }) => {
    const { isActiveUser } = await checkUserExists({
      data: { email: data.email },
    });

    if (!isActiveUser) {
      throw new Error("User does not exist");
    }

    const newValues = {
      ...data,
      // only update password if it is provided
      passwordHash: data.password
        ? await hashPassword(data.password)
        : undefined,
      // only update email if id is provided
      email: data.id ? data.email : undefined,
    };

    return await sqliteDb
      .update(users)
      .set(newValues)
      .where(data.id ? eq(users.id, data.id) : eq(users.email, data.email));
  });

const createUserInputSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  isAdmin: z.boolean(),
  password: z.string(),
});
export const createUser = createServerFn({ method: "POST" })
  .middleware([adminFnMiddleware])
  .validator(zodValidator(createUserInputSchema))
  .handler(async ({ data }) => {
    const { user, isActiveUser } = await checkUserExists({
      data: { email: data.email },
    });

    if (isActiveUser) {
      throw new Error("User already exists");
    }

    if (user?.deletedAt) {
      return await updateUser({
        data: { ...data, id: user.id, deletedAt: null },
      });
    }

    return await sqliteDb
      .insert(users)
      .values({ ...data, passwordHash: await hashPassword(data.password) });
  });

const deleteUserInputSchema = z.object({ id: z.string() });
export const deleteUser = createServerFn({ method: "POST" })
  .middleware([adminFnMiddleware])
  .validator(zodValidator(deleteUserInputSchema))
  .handler(async ({ data }) => {
    return await sqliteDb
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, data.id));
  });
