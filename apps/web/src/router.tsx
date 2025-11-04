import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { NotFound } from "~/components/not-found";
import { toast } from "~/hooks/use-toast";
import { routeTree } from "~/routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
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

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    defaultStaleTime: 1000 * 60,
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
    getScrollRestorationKey: (location) => location.pathname,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    wrapQueryClient: true,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
