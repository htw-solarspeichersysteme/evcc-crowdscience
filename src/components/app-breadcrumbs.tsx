"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { pageDataMap } from "~/app/pageData";

export function Breadcrumbs() {
  const path = usePathname();
  const routes = path.split("/").filter((route) => route.length > 0);

  let fullHref: string | undefined = undefined;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {routes.map((route, i) => {
          const href = fullHref ? `${fullHref}/${route}` : `/${route}`;
          fullHref = href;
          const title = pageDataMap[route]?.title ?? route;

          const isFirst = i === 0;
          const isLast = i === routes.length - 1;
          return (
            <React.Fragment key={href}>
              {isFirst ? null : <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{title}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
