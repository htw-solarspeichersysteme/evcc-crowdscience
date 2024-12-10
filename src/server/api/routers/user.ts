import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { hashPassword } from "~/server/auth/password";
import { users } from "~/server/db/schema";
import { type RouterOutputs } from "~/trpc/react";

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
  create: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        firstName: z.string(),
        lastName: z.string(),
        password: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hashedPassword = await hashPassword(input.password);

      // if user already exists, return error
      const existingUser = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });
      if (existingUser?.deletedAt) {
        // delete user if it was previously deleted
        await ctx.db.delete(users).where(eq(users.id, existingUser.id));
      } else if (existingUser) {
        throw new Error("User already exists");
      }

      return await ctx.db.insert(users).values({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        isAdmin: input.isAdmin,
        passwordHash: hashedPassword,
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        firstName: z.string(),
        lastName: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(users)
        .set(input)
        .where(eq(users.email, input.email));
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
