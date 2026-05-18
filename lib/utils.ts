import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number | undefined, currency = "GBP") {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value);
}

export function formatYearRange(from: number, to: number) {
  return from === to ? `${from}` : `${from}-${to}`;
}
