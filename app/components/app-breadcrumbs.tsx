import React from "react";
import { useRouterState } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { staticDataSchema, tryGettingRouteTitle } from "~/lib/routeHelpers";

export function Breadcrumbs() {
  const { matches } = useRouterState();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {matches.map((match, i) => {
          const res = staticDataSchema.safeParse(match.staticData);

          if (
            // is layout route
            matches[i + 1]?.id === match.id + "/" ||
            // or should not show
            res.data?.routeTitle === false
          ) {
            return null;
          }
          return (
            <React.Fragment key={match.id}>
              {match.id === "__root__" ? null : <BreadcrumbSeparator />}
              <BreadcrumbLink
                to={match.pathname}
                activeOptions={{
                  exact: true,
                }}
                activeProps={{
                  className: "font-normal text-foreground",
                }}
              >
                {tryGettingRouteTitle([match])}
              </BreadcrumbLink>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
