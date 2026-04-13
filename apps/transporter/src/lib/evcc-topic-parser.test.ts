import { describe, expect, test } from "bun:test";

import { parseEvccTopic } from "./evcc-topic-parser";
import { filterTopic } from "./filtering";

const logPath = new URL("../../failed-topics.log", import.meta.url).pathname;
const raw = await Bun.file(logPath).text();
function lineToTopic(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return "";
  let topic = trimmed;
  const parsed = JSON.parse(trimmed) as { topic?: string };
  if (typeof parsed.topic === "string") topic = parsed.topic;
  // Logger may store full MQTT topic `evcc/<instance>/...`; parser expects relative path.
  return topic.replace(/^evcc\/[^/]+\//, "");
}

const topics = [
  ...new Set(
    raw
      .split("\n")
      .map(lineToTopic)
      .filter(Boolean)
      .filter((topic) => !filterTopic(topic)),
  ),
];

describe("evcc-topic-parser: failed-topics.log", () => {
  const passed: {
    topic: string;
    measurement: string;
    field: string;
    tags: Record<string, string>;
  }[] = [];
  const failed: string[] = [];

  for (const topic of topics) {
    const result = parseEvccTopic(topic);
    if (result) {
      passed.push({ topic, ...result });
    } else {
      failed.push(topic);
    }
  }

  test("report parsing results", () => {
    console.log(`\n--- failed-topics.log: ${topics.length} unique topics ---`);
    console.log(`Now parseable: ${passed.length}`);
    console.log(`Still failing:  ${failed.length}\n`);

    if (passed.length > 0) {
      console.log("=== NOW PARSEABLE ===");
      for (const p of passed) {
        const tags =
          Object.keys(p.tags).length > 0
            ? ` tags=${JSON.stringify(p.tags)}`
            : "";
        console.log(
          `  OK  ${p.topic}  ->  measurement=${p.measurement} field=${p.field}${tags}`,
        );
      }
      console.log();
    }

    if (failed.length > 0) {
      console.log("=== STILL FAILING ===");
      for (const f of failed) {
        console.log(`  FAIL  ${f}`);
      }
      console.log();
    }

    expect(passed.length + failed.length).toBe(topics.length);
  });

  test("all previously-failed topics should now parse", () => {
    expect(failed).toEqual([]);
  });
});
