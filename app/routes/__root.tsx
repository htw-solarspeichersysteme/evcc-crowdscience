import { useState, type ReactNode } from "react";
import inter from "@fontsource-variable/inter?url";
import {
  dehydrate,
  HydrationBoundary,
  QueryClientProvider,
  type QueryClient,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  Outlet,
  redirect,
  ScrollRestoration,
} from "@tanstack/react-router";
import { Meta, Scripts } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { sessionQueryOptions } from "~/auth";
import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { NotFound } from "~/components/not-found";
import { createQueryClient } from "~/router";
import css from "~/style.css?url";

let clientQueryClientSingleton: QueryClient | undefined = undefined;
export const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  }
  return (clientQueryClientSingleton ??= createQueryClient());
};

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: css,
      },
      {
        rel: "font",
        href: inter,
      },
    ],
  }),
  component: RootComponent,
  validateSearch: zodValidator(
    z.object({
      sessionChanged: z.boolean().optional(),
    }),
  ),
  beforeLoad: async ({ context, search, location }) => {
    // this is a hack to force the session to definitely
    // be invalidated when a login or logout happens
    if (search?.sessionChanged) {
      void context.queryClient.invalidateQueries(sessionQueryOptions);
      throw redirect({
        to: location.pathname,
        search: {
          sessionChanged: undefined,
        },
      });
    }

    const session = await context.queryClient.fetchQuery(sessionQueryOptions);

    return {
      session,
    };
  },
  loader: async ({ context }) => {
    return {
      dehydratedState: dehydrate(context.queryClient),
    };
  },
  notFoundComponent: NotFound,
  errorComponent: DefaultCatchBoundary,
  staticData: {
    routeTitle: "Home",
  },
});

function RootComponent() {
  const [queryClient] = useState(() => getQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={Route.useLoaderData().dehydratedState}>
        <RootDocument>
          <Outlet />
        </RootDocument>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <Meta />
      </head>
      <body className="font-inter">
        {children}
        <ScrollRestoration />
        <ReactQueryDevtools />
        <Scripts />
      </body>
    </html>
  );
}
