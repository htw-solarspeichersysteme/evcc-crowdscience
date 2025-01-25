import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUnit(value: number | null, unit: string, precision = 2) {
  return value !== null
    ? `${value.toLocaleString("en-US", {
        maximumFractionDigits: precision,
      })} ${unit}`
    : "--";
}

export function formatSecondsInHHMM(seconds: number) {
  return `${Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0")}:${(Math.floor(seconds / 60) % 60)
    .toString()
    .padStart(2, "0")} (${seconds}s)`;
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
  range,
  binSize,
}: {
  data: number[];
  range?: [number, number];
  binSize: number;
}) {
  if (!range) {
    range = [Math.min(...data), Math.max(...data)];
  }

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
