import type { OptionalFetcherDataOptions } from "node_modules/@tanstack/start-client-core/dist/esm/createServerFn";
import type { Middleware, QueryHook } from "react-query-kit";

import { useTimeSeriesSettings } from "~/hooks/use-timeseries-settings";
import type { timeRangeInputSchema } from "./globalSchemas";

export const timeSeriesQueryMiddleware: Middleware<
  QueryHook<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    OptionalFetcherDataOptions<any, typeof timeRangeInputSchema>,
    unknown
  >
> = (useQueryNext) => {
  return (options) => {
    // // @ts-expect-error types are wrong, okay for now
    const { timeRange } = useTimeSeriesSettings();

    return useQueryNext({
      ...options,
      variables: {
        data: {
          ...options.variables?.data,
          timeRange: options.variables?.data?.timeRange ?? timeRange,
        },
      },
    });
  };
};
