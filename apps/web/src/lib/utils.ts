import { clsx, type ClassValue } from "clsx";
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

export function formatSecondsInHHMM(seconds: number) {
  return `${Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0")}:${(Math.floor(seconds / 60) % 60)
    .toString()
    .padStart(2, "0")} (${seconds}s)`;
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
  const numBins = Math.ceil((range[1] - range[0]) / binSize);
  const bins = new Array<number>(numBins).fill(0);

  data.forEach((value) => {
    if (value < range[0] || value > range[1]) return;
    const binIndex = Math.floor((value - range[0]) / binSize);
    const actualIndex = Math.min(binIndex, numBins - 1);
    bins[actualIndex]++;
  });

  return bins;
}
