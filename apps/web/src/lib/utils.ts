import { clsx, type ClassValue } from "clsx";
import { formatDate } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUnit(
  value: number | null | string | undefined,
  unit: string,
  precision = 2,
  useSiPrefix = false,
) {
  if (typeof value === "string") {
    value = Number(value);
    if (Number.isNaN(value)) return "--";
  }
  if (value === null || value === undefined) return "--";

  if (!useSiPrefix) {
    return `${value.toLocaleString("en-US", {
      maximumFractionDigits: precision,
    })} ${unit}`;
  }

  // SI prefixes for large values
  const largePrefixes = [
    { prefix: "T", factor: 1e12 },
    { prefix: "G", factor: 1e9 },
    { prefix: "M", factor: 1e6 },
    { prefix: "k", factor: 1e3 },
  ];

  // SI prefixes for small values
  const smallPrefixes = [
    { prefix: "m", factor: 1e-3 },
    { prefix: "μ", factor: 1e-6 },
    { prefix: "n", factor: 1e-9 },
  ];

  const absValue = Math.abs(value);

  // Find appropriate prefix for large values
  for (const { prefix, factor } of largePrefixes) {
    if (absValue >= factor) {
      return `${(value / factor).toLocaleString("en-US", {
        maximumFractionDigits: precision,
      })} ${prefix}${unit}`;
    }
  }

  // Find appropriate prefix for small values
  if (absValue > 0 && absValue < 1) {
    for (const { prefix, factor } of smallPrefixes) {
      if (absValue >= factor) {
        return `${(value / factor).toLocaleString("en-US", {
          maximumFractionDigits: precision,
        })} ${prefix}${unit}`;
      }
    }
  }

  // No prefix needed
  return `${value.toLocaleString("en-US", {
    maximumFractionDigits: precision,
  })} ${unit}`;
}

export function formatPercentage(value: number | null, precision = 2) {
  return formatUnit(value, "%", precision);
}

export function formatCurrency(value: number | null, currency: string) {
  if (value === null) return "--";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatSecondsInHHMM(seconds: number) {
  return `${Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0")}:${(Math.floor(seconds / 60) % 60)
    .toString()
    .padStart(2, "0")} h`;
}

// Format duration as "Xh Ym" or "Xm" for short durations
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function formatDateTime(date: Date) {
  return formatDate(date, "dd MMM yyyy - HH:mm:ss");
}

export function formatDateTimeRange(start: Date, end: Date) {
  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
}

export function formatCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 0 || count > 1 ? plural : singular}`;
}

export function roundToNiceNumber(value: number) {
  const power = Math.max(Math.round(Math.log10(value * 1.1) - 0.3), 1);
  const numberRange = Math.pow(10, power);

  return Math.ceil((value + 1) / numberRange) * numberRange;
}

export function withinRange(min: number, max: number, value?: number) {
  if (!value) return false;
  return value >= min && value <= max;
}

export function histogram({
  data,
  range = [Math.min(...data), Math.max(...data)],
  binSize,
}: {
  data: number[];
  range?: [number, number];
  binSize: number;
}) {
  return histogramWithBins({ data, range, binSize }).map(([_, count]) => count);
}

export function histogramWithBins({
  data,
  range = [Math.min(...data), Math.max(...data)],
  binSize,
}: {
  data: number[];
  range?: [number, number];
  binSize: number;
}) {
  const numBins = Math.ceil((range[1] - range[0]) / binSize);
  const bins = new Array<number[]>(numBins)
    .fill([])
    .map((_, i) => [binSize * i, 0]);

  data.forEach((value) => {
    if (value < range[0] || value > range[1]) return;
    const binIndex = Math.floor((value - range[0]) / binSize);
    const actualIndex = Math.min(binIndex, numBins - 1);
    bins[actualIndex][1]++;
  });

  return bins;
}
