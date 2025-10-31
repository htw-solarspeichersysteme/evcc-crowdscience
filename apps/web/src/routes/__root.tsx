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
import { z } from "zod";

import { sessionQueryOptions } from "~/auth";
import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { LogoIcon } from "~/components/logo";
import { NotFound } from "~/components/not-found";
import { env } from "~/env";
import { timeRangeUrlSchema } from "~/lib/globalSchemas";
import css from "~/styles/app.css?url";

const isProduction = env.PUBLIC_BASE_URL === "https://evcc-crowdscience.de";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  validateSearch: z.object({
    timeRange: timeRangeUrlSchema,
    expandedKey: z.string().optional(),
  }),
  search: {
    middlewares: [stripSearchParams({ timeRange: {} })],
  },
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: DefaultCatchBoundary,
  staticData: {
    routeTitle: () => <LogoIcon />,
  },
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions);
    return {
      session,
    };
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
      {
        name: "robots",
        content: isProduction ? "noindex, nofollow" : "index, follow",
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
      <body className="font-inter flex min-h-screen flex-col">
        <Outlet />
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
        <Scripts />
      </body>
    </html>
  );
}
