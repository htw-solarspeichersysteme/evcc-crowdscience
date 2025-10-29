import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { subHours } from "date-fns";
import { type z } from "zod";

import type { instancesFilterSchema } from "~/lib/globalSchemas";
import { withinRange } from "~/lib/utils";
import { orpc } from "~/orpc/client";
import type { InstancesOverview } from "~/orpc/instances/getOverview";

export function filterInstances(
  instances: InstancesOverview,
  filter?: z.infer<typeof instancesFilterSchema>,
) {
  if (!filter) return instances;
  return instances.filter((instance) => {
    // check id
    if (filter?.id && !instance.publicName?.includes(filter.id)) return false;

    // check updatedWithinHours
    if (
      !instance.lastReceivedDataAt ||
      (filter?.updatedWithinHours &&
        instance.lastReceivedDataAt <
          subHours(new Date(), filter.updatedWithinHours))
    )
      return false;

    // check pvPower
    if (
      filter?.pvPower &&
      !withinRange(filter.pvPower[0], filter.pvPower[1], instance.pvMaxPowerKw)
    ) {
      return false;
    }

    // check loadpointPower
    if (
      filter?.loadpointPower &&
      !withinRange(
        filter.loadpointPower[0],
        filter.loadpointPower[1],
        instance.loadpointMaxPowerKw,
      )
    ) {
      return false;
    }
    return true;
  });
}

export function useInstancesFilter() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/dashboard" });
  const filter = search.iFltr;

  const { data: instances } = useSuspenseQuery(
    orpc.instances.getOverview.queryOptions(),
  );

  const filteredInstances = useMemo(
    () => filterInstances(instances, filter),
    [instances, filter],
  );

  const updateFilter = (values: z.infer<typeof instancesFilterSchema>) => {
    return navigate({
      // @ts-ignore
      search: (prev) => ({
        ...prev,
        iFltr: values,
      }),
    });
  };

  return {
    filter,
    updateFilter,
    filteredInstances,
    instances,
  };
}
