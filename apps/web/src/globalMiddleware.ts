import { createMiddleware, json } from "@tanstack/react-start";

import { getClientSession } from "./auth";

export const sessionMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next }) => {
    const session = await getClientSession();
    return next({ context: { session } });
  },
);

export const protectedFnMiddleware = createMiddleware({ type: "request" })
  .middleware([sessionMiddleware])
  .server(async ({ next, context }) => {
    if (context?.session?.user) {
      return next({ context });
    }
    throw json({ message: "Unauthorized" }, { status: 401 });
  });

export const adminFnMiddleware = createMiddleware({ type: "request" })
  .middleware([sessionMiddleware])
  .server(async ({ next, context }) => {
    if (context?.session?.user?.isAdmin) {
      return next();
    }
    throw json({ message: "Unauthorized" }, { status: 401 });
  });
