import { cache } from "react";
import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import SuperJSON from "superjson";

import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { NotFound } from "~/components/not-found";
import { routeTree } from "~/routeTree.gen";

export const createQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,
          refetchOnWindowFocus: true,
        },
        dehydrate: {
          serializeData: SuperJSON.serialize,
          shouldDehydrateQuery: (query) =>
            defaultShouldDehydrateQuery(query) ||
            query.state.status === "pending",
        },
        hydrate: {
          deserializeData: SuperJSON.deserialize,
        },
      },
    }),
);

export function createRouter() {
  const queryClient = createQueryClient();
  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultErrorComponent: DefaultCatchBoundary,
      defaultNotFoundComponent: NotFound,
      // defaultPendingComponent: () => <div>Loading...</div>,
      defaultPreload: "intent",
      defaultStaleTime: 1000 * 30,
      transformer: SuperJSON,
      context: {
        queryClient,
      },
    }),
    queryClient,
  );

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
