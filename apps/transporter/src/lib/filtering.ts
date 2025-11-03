export function filterTopic(topic: string): boolean {
  const invalidSubstrings = [
    "forecast",
    "title",
    "vehicleOdometer",
    "tariffPrice",
    "tariffCo2",
  ];
  if (invalidSubstrings.some((substring) => topic.includes(substring)))
    return true;
  return false;
}
