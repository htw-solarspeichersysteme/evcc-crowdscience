import { useRouterState } from "@tanstack/react-router";

import { PageTitle } from "~/components/ui/typography";
import { tryGettingRouteTitle } from "~/lib/routeHelpers";

export function DynamicPageTitle() {
  const { matches } = useRouterState();

  const { title, topLevelComponent } = tryGettingRouteTitle(matches);

  if (topLevelComponent) {
    return (
      <div className="flex justify-between gap-2">
        <PageTitle>{title}</PageTitle>
        {topLevelComponent}
      </div>
    );
  }
  return <PageTitle>{title}</PageTitle>;
}
