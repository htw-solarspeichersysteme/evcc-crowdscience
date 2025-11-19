import { os } from "@orpc/server";
import { z } from "zod";

import { getClientSession, validateBasicAuth } from "~/auth";
import type { Role } from "~/lib/auth/schemas";
import type { DefaultContext } from "~/lib/auth/session";
import { isInfluxDBError } from "~/lib/influx-query";

function createRoleMiddleware(role: Role) {
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

/**
 * Base procedure with InfluxDB error definitions.
 * Use this for procedures that query InfluxDB to get typesafe error handling.
 */
export const influxProcedure = publicProcedure.errors({
  INFLUXDB_QUERY_ERROR: {
    message: "Failed to query InfluxDB",
    status: 502,
    data: z.object({
      message: z.string(),
      query: z.string().optional(),
    }),
  },
});

/**
 * Procedure with InfluxDB error handling middleware.
 * Use this instead of os or publicProcedure for handlers that query InfluxDB.
 * Automatically converts InfluxDB errors to typesafe ORPC errors.
 */
export const influxProcedureWithErrorHandling = influxProcedure.use(
  influxProcedure.middleware(async ({ next, errors }) => {
    try {
      return await next();
    } catch (error) {
      // Check if it's an InfluxDB-related error
      if (isInfluxDBError(error)) {
        console.error("InfluxDB query error:", error);
        throw errors.INFLUXDB_QUERY_ERROR({
          message: "Failed to query InfluxDB",
          data: {
            message: error instanceof Error ? error.message : "Unknown error",
            query: (error as { query?: string }).query,
          },
        });
      }
      // Re-throw other errors
      throw error;
    }
  }),
);
