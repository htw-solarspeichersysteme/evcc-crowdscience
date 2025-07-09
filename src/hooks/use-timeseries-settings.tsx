import { useNavigate, useSearch } from "@tanstack/react-router";

import type { UrlTimeRange } from "~/lib/globalSchemas";

export function useTimeSeriesSettings() {
  const navigate = useNavigate({ from: "/" });
  const search = useSearch({ from: "__root__" });
  return {
    timeRange: search.timeRange,
    updateTimeRange: (timeRange: UrlTimeRange) =>
      navigate({
        replace: true,
        to: ".",
        search: (prev) => ({ ...prev, timeRange }),
      }),
  };
}
