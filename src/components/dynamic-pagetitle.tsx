"use client";

import { usePathname } from "next/navigation";

import { pageDataMap } from "~/app/pageData";
import { PageTitle } from "./ui/typography";

export function DynamicPageTitle() {
  const path = usePathname();
  const parts = path.split("/").filter((route) => route.length > 0);
  const page = parts[parts.length - 1] ?? "";
  const title = pageDataMap[page]?.title ?? page;

  return <PageTitle>{title}</PageTitle>;
}
