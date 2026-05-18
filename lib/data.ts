// Synthetic data access layer — Stream 5 owns this.
// For now we read JSON files. Swap to a real DB later without changing call sites.

import listingsJson from "@/data/listings.json";
import vehiclesJson from "@/data/vehicles.json";
import rulesJson from "@/data/compatibility-rules.json";
import type { Listing, Vehicle } from "@/lib/types";

export function getAllListings(): Listing[] {
  return listingsJson as Listing[];
}

export function getListingById(id: string): Listing | undefined {
  return getAllListings().find((l) => l.id === id);
}

export function getVehicles(): Vehicle[] {
  return vehiclesJson as Vehicle[];
}

// Compatibility rules — keyed by `${make}|${model}` -> generations / variants.
// Used by lib/compatibility.ts.
export function getCompatibilityRules(): Record<string, CompatibilityRule[]> {
  return rulesJson as Record<string, CompatibilityRule[]>;
}

export interface CompatibilityRule {
  generation: string; // e.g. "Mk7"
  yearFrom: number;
  yearTo: number;
  notes?: string;
}
