import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { BatchHandlerPlugin } from "@orpc/server/plugins";
import { createFileRoute } from "@tanstack/react-router";

import { getClientSession } from "~/auth";
import { router } from "~/orpc/router";

const handler = new RPCHandler(router, {
  interceptors: [onError(console.error)],
  plugins: [new BatchHandlerPlugin()],
});

async function handle({ request }: { request: Request }) {
  const session = await getClientSession();
  const { response } = await handler.handle(request, {
    prefix: "/api/orpc",
    context: { session },
  });

  return response ?? new Response("Not Found", { status: 404 });
}
export const Route = createFileRoute("/api/orpc/$")({
  server: { handlers: { ANY: handle } },
});
