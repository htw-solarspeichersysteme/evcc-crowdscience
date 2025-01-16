import { useNavigate, useSearch } from "@tanstack/react-router";

import type { UrlTimeRange } from "~/lib/globalSchemas";

export function useTimeSeriesSettings() {
  const navigate = useNavigate({ from: "/dashboard" });
  const search = useSearch({ from: "/dashboard" });
  return {
    timeRange: search.timeRange,
    updateTimeRange: (timeRange: UrlTimeRange) =>
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, timeRange }),
      }),
  };
}
