import { Breadcrumbs } from "~/components/app-breadcrumbs";

export default async function BreadcrumbsSlot({
  params,
}: {
  params: Promise<{
    catchAll: string[];
  }>;
}) {
  return <Breadcrumbs routes={(await params).catchAll ?? []} />;
}
