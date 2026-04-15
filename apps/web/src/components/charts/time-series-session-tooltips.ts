import { formatUnit } from "~/lib/utils";
import type {
  CsvImportLoadingSession,
  ExtractedSession,
} from "~/orpc/loadingSessions/types";

export const SESSION_MARK_TOOLTIP_BASE = {
  show: true,
  trigger: "item" as const,
  confine: true,
  borderWidth: 1,
  borderColor: "#e2e8f0",
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  extraCssText:
    "border-radius:12px;box-shadow:0 8px 24px rgba(15,23,42,0.1);padding:10px 12px",
  textStyle: { color: "#334155", fontSize: 12 },
} as const;

const WRAP =
  "max-width:300px;padding:2px 0;font-size:12px;line-height:1.5;color:#334155";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDurationSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${(seconds / 3600).toFixed(1)} h`;
}

export function importedSessionShortLabel(
  session: CsvImportLoadingSession,
): string {
  const parts = [session.loadpoint, session.vehicle].filter((x): x is string =>
    Boolean(x && String(x).trim()),
  );
  if (parts.length > 0) return parts.join(" · ");
  if (session.energy != null) return formatUnit(session.energy, "Wh");
  return "Imported session";
}

function importedHtml(session: CsvImportLoadingSession): string {
  const title =
    [session.loadpoint, session.vehicle].filter(Boolean).join(" · ") ||
    "Imported session";
  const rows = [
    `<div style="font-weight:600;color:rgb(22,163,74);letter-spacing:0.02em">Imported session</div>`,
    `<div style="margin-top:4px;color:#475569">${escapeHtml(title)}</div>`,
    session.energy != null
      ? `<div style="margin-top:2px">${formatUnit(session.energy, "Wh")} charged</div>`
      : null,
    session.duration != null
      ? `<div style="margin-top:2px;color:#64748b">${formatDurationSeconds(session.duration)}</div>`
      : null,
    `<div style="margin-top:6px;padding-top:6px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b">${new Date(session.startTime).toLocaleString()} → ${new Date(session.endTime).toLocaleString()}</div>`,
  ].filter(Boolean);
  return `<div style="${WRAP}">${rows.join("")}</div>`;
}

function extractedHtml(session: ExtractedSession): string {
  const previewRows: (string | null)[] = [
    `<div style="font-weight:600;color:rgb(21,128,61);letter-spacing:0.02em">Detected charging</div>`,
    session.componentId
      ? `<div style="margin-top:4px;color:#475569">${escapeHtml(session.componentId)}</div>`
      : null,
    session.chargedEnergy != null
      ? `<div style="margin-top:2px">${formatUnit(session.chargedEnergy, "Wh", 2, true)} delivered</div>`
      : session.sessionEnergy != null
        ? `<div style="margin-top:2px">${formatUnit(session.sessionEnergy, "Wh", 2, true)} session energy</div>`
        : null,
    session.duration != null
      ? `<div style="margin-top:2px;color:#64748b">${formatDurationSeconds(session.duration)}</div>`
      : null,
    session.startSoc != null && session.endSoc != null
      ? `<div style="margin-top:2px">SoC ${session.startSoc}% → ${session.endSoc}%</div>`
      : null,
    session.maxChargePower != null
      ? `<div style="margin-top:2px">Peak ${formatUnit(session.maxChargePower / 1000, "kW", 2, false)}</div>`
      : null,
    session.solarPercentage != null
      ? `<div style="margin-top:2px;color:#64748b">${Math.round(session.solarPercentage)}% solar share</div>`
      : null,
    session.mode
      ? `<div style="margin-top:2px;color:#64748b">Mode: ${escapeHtml(session.mode)}</div>`
      : null,
    `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b">${new Date(session.startTime).toLocaleString()} → ${new Date(session.endTime).toLocaleString()}</div>`,
  ];
  return `<div style="${WRAP}">${previewRows.filter(Boolean).join("")}</div>`;
}

function payloadImported(data: unknown): CsvImportLoadingSession | null {
  if (data && typeof data === "object" && "importedSession" in data) {
    return (data as { importedSession: CsvImportLoadingSession })
      .importedSession;
  }
  if (Array.isArray(data)) {
    for (const corner of data) {
      if (corner && typeof corner === "object" && "importedSession" in corner) {
        return (corner as { importedSession: CsvImportLoadingSession })
          .importedSession;
      }
    }
  }
  return null;
}

function payloadExtracted(data: unknown): ExtractedSession | null {
  if (data && typeof data === "object" && "session" in data) {
    return (data as { session: ExtractedSession }).session;
  }
  if (Array.isArray(data)) {
    for (const corner of data) {
      if (corner && typeof corner === "object" && "session" in corner) {
        return (corner as { session: ExtractedSession }).session;
      }
    }
  }
  return null;
}

export function formatSessionMarkTooltip(
  params: unknown,
  kind: "imported" | "extracted",
): string {
  const p = params as { data?: unknown; value?: unknown };
  const raw = p.data ?? p.value;
  if (kind === "imported") {
    const s = payloadImported(raw);
    return s ? importedHtml(s) : "";
  }
  const s = payloadExtracted(raw);
  return s ? extractedHtml(s) : "";
}
