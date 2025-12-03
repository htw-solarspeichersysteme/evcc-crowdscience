import type { ExtractedSession, ExtractedSessionRange } from "./types";

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

export function getSessionUrl(session: ExtractedSession) {
  return `/dashboard/instances/${session.instanceId}/session?sessionRangeHash="${session.sessionRangeHash}"`;
}
