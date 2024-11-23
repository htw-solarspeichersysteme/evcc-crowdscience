import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
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

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
