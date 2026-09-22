export const MAX_FAILED_TOPICS = 500;

/** Numbers, and segments containing "-" or whitespace, are free text. */
export function toTopicShape(topic: string): string {
  return topic
    .split("/")
    .map((segment) =>
      /^\d+$/.test(segment) || /[-\s]/.test(segment) ? "+" : segment,
    )
    .join("/");
}

/** Remembers unknown topic shapes for this process, up to a fixed cap. */
export class FailedTopicLogger {
  private loggedShapes = new Set<string>();
  private capWarned = false;

  log(topic: string): void {
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
    console.warn(`[topic-parsing] unknown shape ${shape} example=${topic}`);
  }

  getSeenFailedTopics(): string[] {
    return [...this.loggedShapes];
  }
}
