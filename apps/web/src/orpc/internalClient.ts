import { createRouterClient, onError } from "@orpc/server";

import { router } from "~/orpc/router";

export const internalOrpcClient = createRouterClient(router, {
  context: () => ({
    internal: true,
    session: {},
  }),
  interceptors: [onError(console.error)],
});
