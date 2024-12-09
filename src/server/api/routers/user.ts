import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { hashPassword } from "~/server/auth/password";
import { users } from "~/server/db/schema";

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
        where: eq(users.email, input.email),
      });
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.users.findMany();
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
      return await ctx.db.delete(users).where(eq(users.id, input.id));
    }),
});
