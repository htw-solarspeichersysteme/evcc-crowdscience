import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import SuperJSON from "superjson";

import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { NotFound } from "~/components/not-found";
import { toast } from "~/hooks/use-toast";
import { routeTree } from "~/routeTree.gen";

export function createRouter() {
  const queryClient = new QueryClient({
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
      mutations: {
        onError: (error) => {
          console.error(error);

          toast({
            title: "Error",
            description: error.message,
          });
        },
      },
    },
  });
  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultErrorComponent: DefaultCatchBoundary,
      defaultNotFoundComponent: NotFound,
      // defaultPendingComponent: () => <div>Loading...</div>,
      defaultPreload: "intent",
      defaultStaleTime: 1000 * 60,
      // @ts-expect-error something wrong with tss types
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
