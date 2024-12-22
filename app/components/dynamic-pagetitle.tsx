import { useRouterState } from "@tanstack/react-router";

import { PageTitle } from "~/components/ui/typography";
import { tryGettingRouteTitle } from "~/lib/routeHelpers";

export function DynamicPageTitle() {
  const { matches } = useRouterState();
  const currentRoute = matches[matches.length - 1];

  const title = tryGettingRouteTitle(currentRoute);

  return <PageTitle>{title}</PageTitle>;
}
