import type { ExtractedSessionRange } from "./types";

export function generateSessionRangeHash(sessionRange: ExtractedSessionRange) {
  return String(
    Bun.hash(
      JSON.stringify({
        startTime: sessionRange.startTime,
        endTime: sessionRange.endTime,
        componentId: sessionRange.componentId,
        instanceId: sessionRange.instanceId,
      }),
      1,
    ),
  );
}

export function getSessionRangeUrl(sessionRange: ExtractedSessionRange) {
  return `/dashboard/instances/${sessionRange.instanceId}/session?componentId="${sessionRange.componentId.toString()}"&timeRange=${encodeURIComponent(
    JSON.stringify({
      start: sessionRange.startTime.getTime(),
      end: sessionRange.endTime.getTime(),
      windowMinutes: 0,
    }),
  )}`;
}
