import { createMiddleware, json } from "@tanstack/react-start";

import { getClientSession } from "./auth";

export const sessionMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await getClientSession();
  return next({ context: { session } });
});

export const protectedFnMiddleware = createMiddleware()
  .middleware([sessionMiddleware])
  .server(async ({ next, context }) => {
    if (context?.session?.user) {
      return next();
    }
    throw json({ message: "Unauthorized" }, { status: 401 });
  });

export const adminFnMiddleware = createMiddleware()
  .middleware([sessionMiddleware])
  .server(async ({ next, context }) => {
    if (context?.session?.user?.isAdmin) {
      return next();
    }
    throw json({ message: "Unauthorized" }, { status: 401 });
  });
