import { and, eq, isNull, type InferInsertModel } from "drizzle-orm";
import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  type TRPCContext,
} from "~/server/api/trpc";
import { hashPassword } from "~/server/auth/password";
import { users } from "~/server/db/schema";
import { type RouterOutputs } from "~/trpc/react";

const findUser = async (ctx: TRPCContext, email: string, id?: string) => {
  return await ctx.db.query.users.findFirst({
    where: id ? eq(users.id, id) : eq(users.email, email),
  });
};

const updateUser = async (
  ctx: TRPCContext,
  input: z.infer<typeof updateUserInputSchema> &
    Partial<InferInsertModel<typeof users>>,
) => {
  const newValues = {
    ...input,
    // only update password if it is provided
    passwordHash: input.password
      ? await hashPassword(input.password)
      : undefined,
    // only update email if id is provided
    email: input.id ? input.email : undefined,
  };

  return await ctx.db
    .update(users)
    .set(newValues)
    .where(input.id ? eq(users.id, input.id) : eq(users.email, input.email));
};

const updateUserInputSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  isAdmin: z.boolean(),
  password: z.string().nullable(),
});

export const userRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text} ${Bun.version}`,
      };
    }),
  get: protectedProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.users.findFirst({
        where: and(eq(users.email, input.email), isNull(users.deletedAt)),
      });
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.users.findMany({
      where: isNull(users.deletedAt),
    });
  }),
  create: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        firstName: z.string(),
        lastName: z.string(),
        isAdmin: z.boolean(),
        password: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await findUser(ctx, input.email);

      // if there is an undeleted user with the same email, throw an error
      if (existingUser && !existingUser.deletedAt) {
        throw new Error("User already exists");
      }

      // if there is a deleted user with the same email, restore it
      if (existingUser?.deletedAt) {
        return await updateUser(ctx, {
          ...input,
          deletedAt: null,
        });
      }

      return await ctx.db
        .insert(users)
        .values({ ...input, passwordHash: await hashPassword(input.password) });
    }),
  update: adminProcedure
    .input(updateUserInputSchema)
    .mutation(async ({ ctx, input }) => {
      // check if user exists
      if (!(await findUser(ctx, input.email, input.id))) {
        throw new Error("User does not exist");
      }
      return await updateUser(ctx, input);
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(users)
        .set({ deletedAt: new Date() })
        .where(eq(users.id, input.id));
    }),
});

export type User = RouterOutputs["user"]["getAll"][number];
