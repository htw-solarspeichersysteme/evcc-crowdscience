import { useNavigate, useSearch } from "@tanstack/react-router";
import { subHours } from "date-fns";
import type { OptionalFetcherDataOptions } from "node_modules/@tanstack/start/dist/esm/client/createServerFn";
import type { Middleware, QueryHook } from "react-query-kit";
import { type z } from "zod";

import type { instancesFilterSchema } from "~/lib/globalSchemas";
import { withinRange } from "~/lib/utils";
import {
  instanceApi,
  type getActiveInstances,
  type getActiveInstancesSchema,
} from "~/serverHandlers/instance";

export function useInstancesFilter() {
  const navigate = useNavigate({ from: "/dashboard" });
  const search = useSearch({ from: "/dashboard" });
  const filter = search.iFltr;

  const { data: instances } = instanceApi.getActiveInstances.useSuspenseQuery();
  const filteredInstances = instances.filter((instance) => {
    if (
      !instance.lastUpdate ||
      (filter?.updatedWithinHours &&
        instance.lastUpdate < subHours(new Date(), filter.updatedWithinHours))
    )
      return false;
    // check that it conforms to the filter
    if (
      filter?.pvPower &&
      !withinRange(filter.pvPower[0], filter.pvPower[1], instance.pvPower)
    ) {
      return false;
    }
    if (
      filter?.loadpointPower &&
      !withinRange(
        filter.loadpointPower[0],
        filter.loadpointPower[1],
        instance.loadpointPower,
      )
    ) {
      return false;
    }
    return true;
  });

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
    filteredInstances,
    instances,
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
