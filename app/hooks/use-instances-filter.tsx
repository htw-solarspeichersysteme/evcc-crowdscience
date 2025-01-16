import { useNavigate, useSearch } from "@tanstack/react-router";
import type { OptionalFetcherDataOptions } from "node_modules/@tanstack/start/dist/esm/client/createServerFn";
import type { Middleware, QueryHook } from "react-query-kit";
import { type z } from "zod";

import type { instancesFilterSchema } from "~/lib/globalSchemas";
import { type Route as DashboardRoute } from "~/routes/dashboard";
import { type Route as DashboardInstancesRoute } from "~/routes/dashboard/instances";
import type {
  getActiveInstances,
  getActiveInstancesSchema,
} from "~/serverHandlers/instance";

export function useInstancesFilter({
  routeId,
}: {
  routeId:
    | (typeof DashboardRoute)["id"]
    | (typeof DashboardInstancesRoute)["id"];
}) {
  const navigate = useNavigate({ from: routeId });
  const search = useSearch({ from: routeId });
  const filter = search.iFltr;

  const updateFilter = (values: z.infer<typeof instancesFilterSchema>) =>
    navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        iFltr: values,
      }),
    });

  return {
    filter,
    updateFilter,
  };
}

export const getInstancesQueryMiddleware: Middleware<
  QueryHook<
    Awaited<ReturnType<typeof getActiveInstances>>,
    OptionalFetcherDataOptions<unknown, typeof getActiveInstancesSchema>,
    unknown
  >
> = (useQueryNext) => {
  return (options) => {
    // @ts-expect-error types are wrong, okay for now
    const { filter } = useInstancesFilter({ routeId: undefined });
    return useQueryNext({
      ...options,
      variables: {
        data: {
          filter: filter ?? {},
          ...options.variables?.data,
        },
      },
    });
  };
};
