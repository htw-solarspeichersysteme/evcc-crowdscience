import inter from "@fontsource-variable/inter?url";
import { type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  Outlet,
  ScrollRestoration,
} from "@tanstack/react-router";
import { Meta, Scripts } from "@tanstack/start";

import { sessionQueryOptions } from "~/auth";
import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { NotFound } from "~/components/not-found";
import css from "~/style.css?url";

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
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions);

    return {
      session,
    };
  },
  notFoundComponent: NotFound,
  errorComponent: DefaultCatchBoundary,
  staticData: {
    routeTitle: "Home",
  },
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <Meta />
      </head>
      <body className="font-inter">
        <Outlet />
        <ScrollRestoration />
        <ReactQueryDevtools />
        <Scripts />
      </body>
    </html>
  );
}
