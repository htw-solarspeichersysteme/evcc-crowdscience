import type { ExtractedSession } from "~/orpc/loadingSessions/types";

export function exportSessionAsJson(session: ExtractedSession) {
  const blob = new Blob([JSON.stringify(session, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `session-${session.id}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportSessionAsCsv(session: ExtractedSession) {
  const headers = [
    "id",
    "instanceId",
    "componentId",
    "startTime",
    "endTime",
    "startSoc",
    "endSoc",
    "startRange",
    "endRange",
    "limitSoc",
    "chargedEnergy",
    "sessionEnergy",
    "maxChargePower",
    "maxPhasesActive",
    "mode",
    "price",
    "solarPercentage",
    "sessionCo2PerKWh",
  ];

  const row = [
    session.id,
    session.instanceId,
    session.componentId,
    session.startTime.toISOString(),
    session.endTime.toISOString(),
    session.startSoc?.toString() ?? "",
    session.endSoc?.toString() ?? "",
    session.startRange?.toString() ?? "",
    session.endRange?.toString() ?? "",
    session.limitSoc?.toString() ?? "",
    session.chargedEnergy?.toString() ?? "",
    session.sessionEnergy?.toString() ?? "",
    session.maxChargePower?.toString() ?? "",
    session.maxPhasesActive?.toString() ?? "",
    session.mode ?? "",
    session.price?.toString() ?? "",
    session.solarPercentage?.toString() ?? "",
    session.sessionCo2PerKWh?.toString() ?? "",
  ];

  const csvContent = [headers.join(";"), row.join(";")].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `session-${session.id}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
