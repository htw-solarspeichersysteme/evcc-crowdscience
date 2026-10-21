import {
  afterEach,
  beforeEach,
  describe,
  expect,
  spyOn,
  test,
  type Mock,
} from "bun:test";

import {
  FailedTopicLogger,
  MAX_FAILED_TOPICS,
  toTopicShape,
} from "./failed-topic-logger";

describe("toTopicShape", () => {
  test("should collapse numeric segments", () => {
    expect(toTopicShape("site/battery/2/soc")).toBe("site/battery/+/soc");
  });

  test("should collapse segments containing hyphens or whitespace", () => {
    expect(toTopicShape("site/grid/my-meter/power")).toBe("site/grid/+/power");
    expect(toTopicShape("site/grid/my meter/power")).toBe("site/grid/+/power");
  });

  test("should collapse user-defined ids below collection segments", () => {
    expect(toTopicShape("vehicles/MyTesla/foo")).toBe("vehicles/+/foo");
    expect(toTopicShape("site/circuits/Garage/bar")).toBe(
      "site/circuits/+/bar",
    );
  });

  test("should keep known field names", () => {
    expect(toTopicShape("site/gridPower")).toBe("site/gridPower");
  });
});

describe("FailedTopicLogger", () => {
  let warn: Mock<typeof console.warn>;

  beforeEach(() => {
    warn = spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  test("should log each shape once across instances", () => {
    const logger = new FailedTopicLogger();

    logger.log("instance-a", "vehicles/Tesla/unknownField");
    logger.log("instance-b", "vehicles/Zoe/unknownField");

    expect(logger.getSeenFailedTopics()).toEqual(["vehicles/+/unknownField"]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "[topic-parsing] unknown shape vehicles/+/unknownField example=evcc/instance-a/vehicles/Tesla/unknownField",
    );
  });

  test("should stop remembering shapes and warn once when the cap is reached", () => {
    const logger = new FailedTopicLogger();

    for (let i = 0; i < MAX_FAILED_TOPICS + 10; i++) {
      logger.log("instance", `site/unknownField${i}`);
    }

    expect(logger.getSeenFailedTopics()).toHaveLength(MAX_FAILED_TOPICS);
    expect(warn).toHaveBeenCalledTimes(MAX_FAILED_TOPICS + 1);
  });
});
