/// <reference types="vite/client" />
import inter from "@fontsource-variable/inter?url";
import { type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  stripSearchParams,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { sessionQueryOptions } from "~/auth";
import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { LogoIcon } from "~/components/logo";
import { NotFound } from "~/components/not-found";
import { timeRangeUrlSchema } from "~/lib/globalSchemas";
import css from "~/styles/app.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  validateSearch: zodValidator(
    z.object({
      timeRange: timeRangeUrlSchema,
      expandedKey: z.string().optional(),
    }),
  ),
  search: {
    middlewares: [stripSearchParams({ timeRange: {} })],
  },
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions);
    return {
      session,
    };
  },
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: DefaultCatchBoundary,
  staticData: {
    routeTitle: () => <LogoIcon />,
  },
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
        title: "EVCC-Crowdscience",
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
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col font-inter">
        <Outlet />
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
        <Scripts />
      </body>
    </html>
  );
}
