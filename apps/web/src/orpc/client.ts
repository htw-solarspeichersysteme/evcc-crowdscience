import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createRouterClient, type RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getHeaders } from "@tanstack/react-start/server";

import { router } from "./router";

const getORPCClient = createIsomorphicFn()
  .server(() =>
    createRouterClient(router, {
      context: () => ({
        headers: getHeaders(),
      }),
      interceptors: [onError(console.error)],
    }),
  )
  .client((): RouterClient<typeof router> => {
    const link = new RPCLink({
      url: `${window.location.origin}/orpc`,
      interceptors: [onError(console.error)],
    });

    return createORPCClient(link);
  });

export const client: RouterClient<typeof router> = getORPCClient();
export const orpc = createTanstackQueryUtils(client);
