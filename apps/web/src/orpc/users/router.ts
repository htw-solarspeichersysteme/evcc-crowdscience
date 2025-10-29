import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";

import { sqliteDb } from "~/db/client";
import { users } from "~/db/schema";
import { hashPassword } from "~/lib/session";
import { adminProcedure, authedProcedure } from "../middleware";

const userColumns = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isAdmin: true,
} as const;

const getUserInputSchema = z
  .object({
    email: z.email(),
    mode: z.literal("email").prefault("email"),
  })
  .or(z.object({ id: z.string(), mode: z.literal("id").prefault("id") }));

const getMultipleUsersInputSchema = z
  .object({ ids: z.array(z.string()).optional() })
  .optional();

const updateUserInputSchema = z.object({
  id: z.string().optional(),
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  isAdmin: z.boolean(),
  password: z.string().nullable(),
  deletedAt: z.date().nullable().optional(),
});

const createUserInputSchema = z.object({
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  isAdmin: z.boolean(),
  password: z.string(),
});

const deleteUserInputSchema = z.object({ id: z.string() });
const undoDeleteUserInputSchema = z.object({ id: z.string() });

async function checkUserExists(email: string) {
  const user = await sqliteDb.query.users.findFirst({
    where: eq(users.email, email),
  });

  const isActiveUser = user && !user.deletedAt;
  return { user, isActiveUser };
}

export const usersRouter = {
  get: authedProcedure.input(getUserInputSchema).handler(async ({ input }) => {
    const user = await sqliteDb.query.users.findFirst({
      where: and(
        isNull(users.deletedAt),
        input.mode === "email"
          ? eq(users.email, input.email)
          : eq(users.id, input.id),
      ),
      columns: userColumns,
    });

    return user;
  }),

  getMultiple: authedProcedure
    .input(getMultipleUsersInputSchema)
    .handler(async ({ input }) => {
      return await sqliteDb.query.users.findMany({
        where: and(
          isNull(users.deletedAt),
          input?.ids ? inArray(users.id, input.ids) : undefined,
        ),
        columns: userColumns,
      });
    }),

  update: adminProcedure
    .input(updateUserInputSchema)
    .handler(async ({ input }) => {
      const { isActiveUser } = await checkUserExists(input.email);

      if (!isActiveUser) {
        throw new Error("User does not exist");
      }

      const newValues = {
        ...input,
        // only update password if it is provided
        passwordHash: input.password
          ? await hashPassword(input.password)
          : undefined,
        // only update email if id is provided
        email: input.id ? input.email : undefined,
      };

      return await sqliteDb
        .update(users)
        .set(newValues)
        .where(
          input.id ? eq(users.id, input.id) : eq(users.email, input.email),
        );
    }),

  create: adminProcedure
    .input(createUserInputSchema)
    .handler(async ({ input }) => {
      const { user, isActiveUser } = await checkUserExists(input.email);

      if (isActiveUser) {
        throw new Error("User already exists");
      }

      if (user?.deletedAt) {
        return await sqliteDb
          .update(users)
          .set({
            ...input,
            passwordHash: await hashPassword(input.password),
            deletedAt: null,
          })
          .where(eq(users.id, user.id));
      }

      return await sqliteDb
        .insert(users)
        .values({ ...input, passwordHash: await hashPassword(input.password) });
    }),

  delete: adminProcedure
    .input(deleteUserInputSchema)
    .handler(async ({ input }) => {
      return await sqliteDb
        .update(users)
        .set({ deletedAt: new Date() })
        .where(eq(users.id, input.id));
    }),

  undoDelete: adminProcedure
    .input(undoDeleteUserInputSchema)
    .handler(async ({ input }) => {
      return await sqliteDb
        .update(users)
        .set({ deletedAt: null })
        .where(eq(users.id, input.id));
    }),
};
