import type { OptionalFetcherDataOptions } from "node_modules/@tanstack/start-client-core/dist/esm/createServerFn";
import type { Middleware, QueryHook } from "react-query-kit";

import { instanceApi } from "~/serverHandlers/instance/serverFns";
import type { instanceIdsFilterSchema } from "./globalSchemas";

export const instancesFilterMiddleware: Middleware<
  QueryHook<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    OptionalFetcherDataOptions<any, typeof instanceIdsFilterSchema>
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
