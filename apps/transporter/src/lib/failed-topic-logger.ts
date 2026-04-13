import { appendFile } from "node:fs/promises";

export type FailedTopicLogEntry = {
  topic: string;
  timestamp: string;
  value: unknown;
};

/** Tracks failed topics in memory and persists new ones to a log file (JSON lines). */
export class FailedTopicLogger {
  private loggedEntryKeys = new Set<string>();

  constructor(private readonly filePath: string) {}

  /** Load previously logged lines from disk for deduplication across restarts. */
  async load(): Promise<void> {
    const file = Bun.file(this.filePath);

    if (!(await file.exists())) await file.write("");

    const content = await file.text();
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parsed = JSON.parse(trimmed) as { topic?: string };
      if (typeof parsed.topic === "string") {
        this.loggedEntryKeys.add(trimmed);
        continue;
      }
      this.loggedEntryKeys.add(
        JSON.stringify({
          topic: trimmed,
          timestamp: "",
          value: null,
        } satisfies FailedTopicLogEntry),
      );
    }
  }

  /** Log a topic that failed to parse. Skips exact duplicate entries (same topic, timestamp, value). */
  async log(entry: FailedTopicLogEntry): Promise<void> {
    const line = JSON.stringify(entry);
    if (this.loggedEntryKeys.has(line)) return;
    this.loggedEntryKeys.add(line);
    try {
      await appendFile(this.filePath, line + "\n");
    } catch (error) {
      console.error(
        `[failed-topic-logger] write failed for ${entry.topic}:`,
        error,
      );
    }
  }

  getSeenFailedTopics(): string[] {
    const topics = new Set<string>();
    for (const key of this.loggedEntryKeys) {
      try {
        const parsed = JSON.parse(key) as { topic?: string };
        if (typeof parsed.topic === "string") topics.add(parsed.topic);
      } catch {
        // ignore malformed
      }
    }
    return [...topics];
  }
}
