import React, { type ReactElement } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const breadcrumbsMap = {
  dashboard: "Dashboard",
  users: "Users",
};

export function Breadcrumbs({ routes = [] }: { routes: string[] }) {
  let fullHref: string | undefined = undefined;
  const breadcrumbItems: ReactElement[] = [];
  let breadcrumbPage: ReactElement = <></>;

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    let href;

    // eslint-disable-next-line prefer-const
    href = fullHref ? `${fullHref}/${route}` : `/${route}`;
    fullHref = href;
    const title = breadcrumbsMap[route as keyof typeof breadcrumbsMap] ?? route;

    if (i === routes.length - 1) {
      breadcrumbPage = (
        <BreadcrumbItem>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      );
    } else {
      breadcrumbItems.push(
        <React.Fragment key={href}>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={href}>{title}</BreadcrumbLink>
          </BreadcrumbItem>
        </React.Fragment>,
      );
    }
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbItems}
        {routes.length > 0 ? <BreadcrumbSeparator /> : null}
        {breadcrumbPage}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
