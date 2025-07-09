import React from "react";
import { useRouterState } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { staticDataSchema, tryGettingRouteTitle } from "~/lib/routeHelpers";
import { LogoIcon } from "./logo";
import { IconLink } from "./public-site-header";

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
            res.data?.routeTitle === false ||
            // route fullpath is almost same as before
            match.fullPath.slice(0, -1) === matches[i - 1]?.fullPath
          ) {
            return null;
          }

          // if is root route, render logo
          if (match.id === "__root__") {
            return (
              <IconLink
                to="/"
                title="Go To Home"
                className="-mr-1 flex items-center gap-2"
                key={match.id}
              >
                <LogoIcon />
              </IconLink>
            );
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
