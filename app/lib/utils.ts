import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function renderUnit(value: number, unit: string, precision = 2) {
  return `${value.toFixed(precision)} ${unit}`;
}
