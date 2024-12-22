import { createMiddleware, json } from "@tanstack/start";

import { useServerSideAppSession } from "./serverHandlers/session";

export const sessionMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await useServerSideAppSession();
  return next({ context: { session } });
});

export const protectedFnMiddleware = createMiddleware()
  .middleware([sessionMiddleware])
  .server(async ({ next, context }) => {
    if (context?.session?.data?.user) {
      return next();
    }
    throw json({ message: "Unauthorized" }, { status: 401 });
  });

export const adminFnMiddleware = createMiddleware()
  .middleware([sessionMiddleware])
  .server(async ({ next, context }) => {
    if (context?.session?.data?.user?.isAdmin) {
      return next();
    }
    throw json({ message: "Unauthorized" }, { status: 401 });
  });
