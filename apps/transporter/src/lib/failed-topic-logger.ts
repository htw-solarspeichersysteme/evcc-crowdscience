export const MAX_FAILED_TOPICS = 500;

/** Segments whose child segment is a user-defined id (e.g. vehicle or circuit name). */
const COLLECTION_SEGMENTS = new Set([
  "loadpoints",
  "vehicles",
  "pv",
  "circuits",
  "ext",
  "devices",
]);

/**
 * Collapse free-text segments of an instance-relative topic to `+`:
 * numbers, children of collection segments, and segments containing "-" or whitespace.
 */
export function toTopicShape(topic: string): string {
  const segments = topic.split("/");
  return segments
    .map((segment, i) => {
      const parent = segments[i - 1];
      const isFreeText =
        /^\d+$/.test(segment) ||
        /[-\s]/.test(segment) ||
        (parent !== undefined && COLLECTION_SEGMENTS.has(parent));
      return isFreeText ? "+" : segment;
    })
    .join("/");
}

/** Remembers unknown topic shapes for this process, up to a fixed cap. */
export class FailedTopicLogger {
  private loggedShapes = new Set<string>();
  private capWarned = false;

  /** `topic` is relative to `evcc/<instanceId>/`. */
  log(instanceId: string, topic: string): void {
    const shape = toTopicShape(topic);
    if (this.loggedShapes.has(shape)) return;
    if (this.loggedShapes.size >= MAX_FAILED_TOPICS) {
      if (!this.capWarned) {
        this.capWarned = true;
        console.warn(
          `[failed-topic-logger] cap of ${MAX_FAILED_TOPICS} reached, dropping new topics`,
        );
      }
      return;
    }

    this.loggedShapes.add(shape);
    console.warn(
      `[topic-parsing] unknown shape ${shape} example=evcc/${instanceId}/${topic}`,
    );
  }

  getSeenFailedTopics(): string[] {
    return [...this.loggedShapes];
  }
}
