export function filterTopic(topic: string): boolean {
  // Filter configuration and metadata topics
  const configPrefixes = [
    "site/config",
    "site/database",
    "site/hems/",
    "site/influx/",
    "site/mqtt/",
    "site/network/",
    "site/shm/",
    "site/sponsor/",
  ];
  if (configPrefixes.some((prefix) => topic.startsWith(prefix))) return true;

  // Filter invalid substrings
  const invalidSubstrings = [
    "title",
    "vehicleodometer",
    "tariffprice",
    "tariffco2",
    "forecast",
    "evopt",
  ];
  if (
    invalidSubstrings.some((substring) =>
      topic.toLowerCase().includes(substring),
    )
  )
    return true;

  return false;
}
