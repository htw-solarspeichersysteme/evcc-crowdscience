import React, { Suspense } from "react";
import inter from "@fontsource-variable/inter?url";
import { type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  Outlet,
  ScrollRestoration,
} from "@tanstack/react-router";
import { Meta, Scripts } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { sessionQueryOptions } from "~/auth";
import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { ImageModal } from "~/components/image-modal";
import { LogoIcon } from "~/components/logo";
import { NotFound } from "~/components/not-found";
import { env } from "~/env";
import { timeRangeUrlSchema } from "~/lib/globalSchemas";
import css from "~/style.css?url";

const TanStackRouterDevtools =
  env.PUBLIC_NODE_ENV === "production"
    ? () => null
    : React.lazy(() =>
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      );

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
        title: "Octopoda Analytics",
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
    scripts:
      env.PUBLIC_NODE_ENV === "development"
        ? [
            {
              type: "module",
              children: `import RefreshRuntime from "/_build/@react-refresh";
    RefreshRuntime.injectIntoGlobalHook(window)
    window.$RefreshReg$ = () => {}
    window.$RefreshSig$ = () => (type) => type`,
            },
          ]
        : [],
  }),
  validateSearch: zodValidator(
    z.object({
      imageModal: z.string().optional(),
      timeRange: timeRangeUrlSchema,
      expandedKey: z.string().optional(),
    }),
  ),
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
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <Meta />
      </head>
      <body className="font-inter flex flex-col min-h-screen">
        <Outlet />
        <ImageModal />
        <ScrollRestoration />
        <Suspense fallback={null}>
          <TanStackRouterDevtools />
        </Suspense>
        <ReactQueryDevtools />
        <Scripts />
      </body>
    </html>
  );
}
