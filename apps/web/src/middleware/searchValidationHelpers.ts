import { redirect } from "@tanstack/react-router";

import { possibleChartTopicsConfig } from "~/lib/time-series-config";

export function ensureDefaultChartTopicField(
  chartTopic: string,
  chartTopicField?: string,
) {
  const topicConfig = possibleChartTopicsConfig[chartTopic];
  if (!topicConfig) return;

  const availableFields = Object.keys(topicConfig.fields);
  if (availableFields.length === 0) return;

  // If no field is selected or the selected field doesn't exist, redirect to default
  if (!chartTopicField || !availableFields.includes(chartTopicField)) {
    throw redirect({
      to: ".",
      search: (prev) => ({
        ...prev,
        chartTopicField: availableFields[0],
      }),
    });
  }
}
