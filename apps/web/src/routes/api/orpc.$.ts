import { onError } from "@orpc/client";
import { RPCHandler } from "@orpc/server/fetch";
import { createServerFileRoute } from "@tanstack/react-start/server";

import { getClientSession } from "~/auth";
import { router } from "~/orpc/router";

const handler = new RPCHandler(router, {
  interceptors: [onError(console.error)],
});

async function handle({ request }: { request: Request }) {
  const session = await getClientSession();
  const { response } = await handler.handle(request, {
    prefix: "/api/orpc",
    context: { session },
  });

  return response ?? new Response("Not Found", { status: 404 });
}
export const ServerRoute = createServerFileRoute("/api/orpc/$").methods({
  HEAD: handle,
  GET: handle,
  POST: handle,
  PUT: handle,
  DELETE: handle,
  PATCH: handle,
  OPTIONS: handle,
});
