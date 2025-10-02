import { os } from "@orpc/server";

import { getClientSession, validateBasicAuth } from "~/auth";
import type { DefaultContext } from "~/lib/session";

function createRoleMiddleware(role: "user" | "admin") {
  return os
    .errors({
      UNAUTHORIZED: {
        message: "Unauthorized",
        status: 401,
      },
    })
    .$context<DefaultContext>()
    .middleware(async ({ context, next, errors }) => {
      const session = context.session ?? (await getClientSession());

      // if the user is authenticated via basic auth
      // we can skip the session check
      if (await validateBasicAuth({ data: { role } })) {
        return next();
      }

      if (
        // no session or user
        !session?.user ||
        // user is not admin but must be
        (role === "admin" && !session.user.isAdmin)
      ) {
        throw errors.UNAUTHORIZED();
      }
      return next({ context: { session } });
    });
}

export const publicProcedure = os.$context<DefaultContext>().errors({
  UNAUTHORIZED: {
    message: "Unauthorized",
    status: 401,
  },
});

export const authedProcedure = publicProcedure.use(
  createRoleMiddleware("user"),
);
export const adminProcedure = publicProcedure.use(
  createRoleMiddleware("admin"),
);
