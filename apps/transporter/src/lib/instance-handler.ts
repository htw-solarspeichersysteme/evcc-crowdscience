import { createStorage, type StorageValue } from "unstorage";
import memoryDriver from "unstorage/drivers/memory";

import { influxWriter, toLineProtocol } from "~/clients/influxdb";
import { parseEvccTopic } from "~/lib/evcc-topic-parser";
import { type FailedTopicLogger } from "~/lib/failed-topic-logger";

const storage = createStorage();
storage.mount("cache", memoryDriver());
storage.mount("collect", memoryDriver());

/** Store an incoming MQTT message for later processing. */
export function collectMessage(topic: string, message: string): Promise<void> {
  // replace colons in freeform text to avoid problems with unstorage
  topic = topic.replaceAll(":", "_colonreplacement_");
  return storage.setItem(`collect/${topic}`, message);
}

/** Diff collected messages against cache and write changes to InfluxDB. */
export async function handleInstanceUpdate(
  instanceId: string,
  timestamp: string,
  failedTopicLogger: FailedTopicLogger,
  tooOldMilliseconds: number,
): Promise<void> {
  const seenItems = await storage
    .getItems(await storage.getKeys(`collect/evcc/${instanceId}`))
    .then((items) => items.sort((a, b) => a.key.localeCompare(b.key)));

  const itemsToWrite: { key: string; value: StorageValue }[] = [];

  for (const item of seenItems) {
    const cacheKey = item.key.replace("collect:", "cache:");
    const previousValue = await storage.getItem(cacheKey);
    const lastWriteTimestamp = (await storage.getMeta(cacheKey))?.lastWrite;

    const valueChanged = previousValue !== item.value;
    const lastWriteTooOld =
      lastWriteTimestamp &&
      typeof lastWriteTimestamp === "number" &&
      Date.now() - lastWriteTimestamp > tooOldMilliseconds;

    if (valueChanged || lastWriteTooOld) {
      itemsToWrite.push({ key: item.key, value: item.value });

      await storage.setItem(cacheKey, item.value);
      await storage.setMeta(cacheKey, { lastWrite: Date.now() });
    }
  }

  appendToInfluxBuffer({
    instanceId,
    items: itemsToWrite,
    timestamp,
    failedTopicLogger,
  });

  await Promise.all(seenItems.map((item) => storage.remove(item.key)));
}

export function appendToInfluxBuffer({
  instanceId,
  items,
  timestamp,
  failedTopicLogger,
}: {
  instanceId: string;
  items: { key: string; value: StorageValue }[];
  timestamp: string;
  failedTopicLogger: FailedTopicLogger;
}) {
  if (items.length === 0) return;

  let parseFailures = 0;
  const lines = items
    .map((item) => {
      const topic = item.key
        .replace(`collect:evcc:${instanceId}:`, "")
        .replaceAll(":", "/")
        // replace colons back in
        .replaceAll("_colonreplacement_", ":");
      const metric = parseEvccTopic(topic);
      if (!metric) {
        parseFailures++;
        console.warn(`[topic-parsing] failed to parse topic: ${topic}`);
        void failedTopicLogger.log({
          topic: `evcc/${instanceId}/${topic}`,
          timestamp,
          value: item.value,
        });
        return null;
      }

      if (
        item.value === null ||
        item.value === undefined ||
        (typeof item.value === "number" && isNaN(item.value)) ||
        (typeof item.value === "string" && item.value.trim() === "")
      ) {
        return null;
      }

      return toLineProtocol({
        metric,
        value: item.value,
        instanceId,
        timestamp,
      });
    })
    .filter((line): line is string => line !== null);

  if (lines.length === 0) return;

  influxWriter.addLines(lines);
  console.log(
    `[influx-buffer] ${lines.length} items for instance ${instanceId} (buffer: ${influxWriter.bufferedLineCount})` +
      (parseFailures > 0 ? ` (${parseFailures} topics failed to parse)` : ""),
  );
}
