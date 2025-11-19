import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import {
  createRouterClient,
  onError as onErrorServer,
  type RouterClient,
} from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { getClientSession } from "~/auth";
import { router } from "./router";

const getORPCClient = createIsomorphicFn()
  .server(() =>
    createRouterClient(router, {
      context: async () => ({
        headers: getRequestHeaders(),
        session: (await getClientSession()) ?? {},
      }),
      interceptors: [onErrorServer(console.error)],
    }),
  )
  .client((): RouterClient<typeof router> => {
    const link = new RPCLink({
      url: `${window.location.origin}/api/orpc`,
      interceptors: [onError(console.error)],
    });

    return createORPCClient(link);
  });

export const client: RouterClient<typeof router> = getORPCClient();
export const orpc = createTanstackQueryUtils(client);
