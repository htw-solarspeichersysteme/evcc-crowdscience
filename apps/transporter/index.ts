import { influxWriter } from "~/clients/influxdb";
import { mqttClient } from "~/clients/mqtt";
import { FailedTopicLogger } from "~/lib/failed-topic-logger";
import { filterTopic } from "~/lib/filtering";
import { healthcheckResponse } from "~/lib/health";
import { collectMessage, handleInstanceUpdate } from "~/lib/instance-handler";
import { InstanceValidator } from "~/lib/instance-validator";

const TOO_OLD_MILLISECONDS = 1000 * 60 * 10;
const FILTER_INSTANCE_IDS = Bun.env.FILTER_INSTANCE_IDS !== "false";
const FAILED_TOPICS_FILE = "failed-topics.log";
const UPDATE_DELAY_MS = 1000;

const failedTopicLogger = new FailedTopicLogger(FAILED_TOPICS_FILE);
await failedTopicLogger.load();

const instanceValidator = new InstanceValidator(FILTER_INSTANCE_IDS);

const HEALTHCHECK_PORT = 3000;

const healthServer = Bun.serve({
  port: HEALTHCHECK_PORT,
  routes: {
    "/healthcheck": {
      GET: () => healthcheckResponse(mqttClient.connected),
    },
  },
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`[healthcheck] listening on ${healthServer.url.toString()}`);

mqttClient.on("connect", () => {
  console.log("[mqtt] connected");
});

mqttClient.subscribe("evcc/#");
mqttClient.on("message", async (topic, rawMessage, packet) => {
  try {
    const message = rawMessage.toString();
    if (filterTopic(topic) || packet.retain) return;

    const instanceId = topic.split("/")[1];
    if (!instanceId) return;
    if (!instanceValidator.isValid(instanceId)) return;

    await collectMessage(topic, message);

    if (topic.endsWith("/updated")) {
      setTimeout(() => {
        handleInstanceUpdate(
          instanceId,
          message,
          failedTopicLogger,
          TOO_OLD_MILLISECONDS,
        ).catch((error) => {
          console.error(
            `[instance-update] failed for ${instanceId}:`,
            error instanceof Error ? error.message : error,
          );
        });
      }, UPDATE_DELAY_MS);
    }
  } catch (error) {
    console.error(
      "[mqtt] failed to process message:",
      error instanceof Error ? error.message : error,
    );
  }
});

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`[shutdown] received ${signal}, shutting down gracefully...`);

  await healthServer.stop(true);
  influxWriter.dispose();

  try {
    const flushed = await influxWriter.flush();
    if (flushed > 0) {
      console.log(`[shutdown] flushed ${flushed} buffered lines to InfluxDB`);
    }
  } catch (error) {
    console.error(
      "[shutdown] failed to flush InfluxDB buffer:",
      error instanceof Error ? error.message : error,
    );
  }

  mqttClient.end(false, () => {
    console.log("[shutdown] mqtt disconnected");

    // log failed topics and invalid instance ids
    console.log(
      `[failed-topics] ${failedTopicLogger.getSeenFailedTopics().join("\n")}`,
    );
    console.log(
      `[invalid-instance-ids] ${instanceValidator.getInvalidInstanceIds().join("\n")}`,
    );

    process.exit(0);
  });

  setTimeout(() => {
    console.warn("[shutdown] timed out, forcing exit");
    process.exit(1);
  }, 5000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
