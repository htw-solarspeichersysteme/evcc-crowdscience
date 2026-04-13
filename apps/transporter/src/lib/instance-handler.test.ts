import { afterEach, describe, expect, mock, test } from "bun:test";
import { type StorageValue } from "unstorage";

import { influxWriter } from "~/clients/influxdb";
import { type FailedTopicLogger } from "./failed-topic-logger";
import { appendToInfluxBuffer } from "./instance-handler";

const originalAddLines = influxWriter.addLines.bind(influxWriter);

afterEach(() => {
  influxWriter.addLines = originalAddLines;
});

describe("appendToInfluxBuffer", () => {
  test("writes numeric zero values instead of dropping them", () => {
    const addLines = mock(() => undefined);
    influxWriter.addLines = addLines;

    appendToInfluxBuffer({
      instanceId: "test-instance",
      items: [{ key: "collect:evcc:test-instance:site:grid:power", value: 0 }],
      timestamp: "1234567890",
      failedTopicLogger: {
        log: mock(() => Promise.resolve()),
      } as unknown as FailedTopicLogger,
    });

    expect(addLines).toHaveBeenCalledTimes(1);
    expect(addLines).toHaveBeenCalledWith([
      "grid,instance=test-instance power=0 1234567890",
    ]);
  });

  test("still skips nullish values", () => {
    const addLines = mock(() => undefined);
    influxWriter.addLines = addLines;

    appendToInfluxBuffer({
      instanceId: "test-instance",
      items: [
        { key: "collect:evcc:test-instance:site:grid:power", value: null },
        {
          key: "collect:evcc:test-instance:site:grid:power",
          value: undefined as unknown as StorageValue,
        },
      ],
      timestamp: "1234567890",
      failedTopicLogger: {
        log: mock(() => Promise.resolve()),
      } as unknown as FailedTopicLogger,
    });

    expect(addLines).not.toHaveBeenCalled();
  });
});
