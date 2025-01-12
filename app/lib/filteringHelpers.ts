import type { OptionalFetcherDataOptions } from "node_modules/@tanstack/start/dist/esm/client/createServerFn";
import type { Middleware, QueryHook } from "react-query-kit";
import { type z } from "zod";

import { instanceApi } from "~/serverHandlers/instance";
import type { instanceIdsFilterSchema } from "./globalSchemas";

export const instancesFilterMiddleware: Middleware<
  QueryHook<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    | OptionalFetcherDataOptions<
        z.infer<typeof instanceIdsFilterSchema> | undefined
      >
    | undefined
  >
> = (useQueryNext) => {
  const activeInstances = instanceApi.getActiveInstances.useSuspenseQuery({
    select: (data) => data.map((instance) => instance.id),
  });

  return (options) => {
    return useQueryNext({
      ...options,
      variables: {
        data: {
          ...options.variables?.data,
          instanceIds: activeInstances.data,
        },
      },
    });
  };
};
