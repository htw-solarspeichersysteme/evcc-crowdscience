import * as z from "zod";

export const loginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  redirect: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const roleSchema = z.enum(["user", "admin"]);
export type Role = z.infer<typeof roleSchema>;
