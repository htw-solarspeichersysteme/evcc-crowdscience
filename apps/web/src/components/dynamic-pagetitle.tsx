import { useRouterState } from "@tanstack/react-router";

import { PageTitle } from "~/components/ui/typography";
import { tryGettingRouteTitle } from "~/lib/routeHelpers";

export function DynamicPageTitle() {
  const { matches } = useRouterState();

  const title = tryGettingRouteTitle(matches);

  return <PageTitle>{title}</PageTitle>;
}
