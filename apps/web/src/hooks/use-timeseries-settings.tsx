import { useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

import { getTimeRangeDefaults } from "~/constants";
import type { UrlTimeRange } from "~/lib/globalSchemas";

const defaultTimeRange = getTimeRangeDefaults();

export function useTimeSeriesSettings() {
  const navigate = useNavigate();
  const search = useSearch({ from: "__root__" });

  const timeRange = useMemo(
    () => ({
      ...defaultTimeRange,
      ...(search.timeRange ?? {}),
    }),
    [search.timeRange],
  );

  function updateTimeRange(partialTimeRange: UrlTimeRange) {
    const nextTimeRange = {
      ...timeRange,
      ...partialTimeRange,
    };

    const isDefault =
      nextTimeRange.start === defaultTimeRange.start &&
      nextTimeRange.end === defaultTimeRange.end &&
      nextTimeRange.windowMinutes === defaultTimeRange.windowMinutes;

    void navigate({
      replace: true,
      to: ".",
      search: (prev) => ({
        ...prev,
        timeRange: isDefault ? undefined : nextTimeRange,
      }),
    });
  }

  return {
    timeRange,
    updateTimeRange,
  };
}
