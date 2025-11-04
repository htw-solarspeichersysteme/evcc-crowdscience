import destr from "destr";
import { createStorage, type StorageValue } from "unstorage";
import memoryDriver from "unstorage/drivers/memory";

import { influxWriter, toLineProtocol } from "~/clients/influxdb";
import { mqttClient } from "~/clients/mqtt";
import { parseEvccTopic } from "~/lib/evcc-topic-parser";
import { filterTopic } from "./lib/filtering";
import { isUuidV7 } from "./lib/uuid";

const TOO_OLD_MILLISECONDS = 1000 * 60 * 30;
const FILTER_INSTANCE_IDS = Bun.env.FILTER_INSTANCE_IDS !== "false";

const invalidInstanceIds = new Set<string>();

const storage = createStorage();
storage.mount("cache", memoryDriver());
storage.mount("write", memoryDriver());

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
});

mqttClient.subscribe("evcc/#");
mqttClient.on("message", async (topic, rawMessage, packet) => {
  const message = rawMessage.toString();
  if (filterTopic(topic) || packet.retain) return;

  const topicSegments = topic.split("/");
  const instanceId = topicSegments[1];

  // skip messages without an instance id
  if (!instanceId) return;

  // make sure the instance id is a valid uuid v7
  // warn only once per instance id
  if (FILTER_INSTANCE_IDS && !isUuidV7(instanceId)) {
    if (!invalidInstanceIds.has(instanceId)) {
      console.warn("Invalid instance id", instanceId);
      invalidInstanceIds.add(instanceId);
    }

    return;
  }

  const value = destr(message);

  // if value changed or is too old, add it to be written later
  const previousValue = await storage.getItem("cache/" + topic);
  const lastWriteTimestamp = (await storage.getMeta("cache/" + topic))
    ?.lastWrite;

  const valueChanged = previousValue !== value;
  const lastWriteTooOld =
    lastWriteTimestamp &&
    typeof lastWriteTimestamp === "number" &&
    // write when then last write was too old
    Date.now() - lastWriteTimestamp > TOO_OLD_MILLISECONDS;

  if (valueChanged || lastWriteTooOld) {
    await storage.setItem("write/" + topic, message);

    // update cache
    await storage.setItem("cache/" + topic, message);
    await storage.setMeta("cache/" + topic, {
      lastWrite: Date.now(),
    });
  }

  // when the "updated" signal is received, schedule writing
  if (topic.endsWith("/updated")) {
    setTimeout(() => handleInstanceUpdate(instanceId, message), 2000);
  }
});

async function handleInstanceUpdate(
  instanceId: string,
  timestamp: string,
): Promise<void> {
  const instanceKeys = await storage.getKeys(`write/evcc/${instanceId}`);
  const items = await storage
    .getItems(instanceKeys)
    .then((items) => items.sort((a, b) => a.key.localeCompare(b.key)));

  await writeItemsToInflux({ instanceId, items, timestamp });
  await Promise.all(items.map((item) => storage.remove(item.key)));
}

async function writeItemsToInflux({
  instanceId,
  items,
  timestamp,
}: {
  instanceId: string;
  items: { key: string; value: StorageValue }[];
  timestamp: string;
}) {
  // generate line protocol text for all items
  const lineProtocol =
    items
      .map((item) => {
        // parse the metric from the key (topic)
        const metric = parseEvccTopic(item.key.split(":").slice(3).join("/"));
        if (!metric || !item.value) return null;

        return toLineProtocol({
          metric,
          value: item.value,
          instanceId,
          timestamp,
        });
      })
      // filter out values where parsing failed or the value is null
      .filter(Boolean)
      // join all line protocol texts with a newline
      .join("\n") + "\n";

  console.log(lineProtocol);
  return influxWriter.write(lineProtocol);
}
