/// <reference types="vite/client" />
import inter from "@fontsource-variable/inter?url";
import { type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
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
        content: isProduction ? "index, follow" : "noindex, nofollow",
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
      {
        rel: "icon",
        href: "/evcc-crowdscience.svg",
      },
    ],
    scripts: [
      isProduction
        ? {
            defer: true,
            src: "https://umami.evcc-crowdscience.de/script.js",
            "data-website-id": "b883778f-553a-4ad7-a3c4-11d4803dce37",
          }
        : undefined,
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
