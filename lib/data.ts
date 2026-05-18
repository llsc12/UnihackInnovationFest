// Data access layer — Stream 5 owns this.
// All functions are async and query Supabase. Swap the implementation here
// without touching call sites if you ever need a different backend.

import { createServerClient } from "@/lib/supabase";
import type { Listing, Vehicle } from "@/lib/types";

export interface CompatibilityRule {
  generation: string;
  yearFrom: number;
  yearTo: number;
  notes?: string;
}

export async function getAllListings(): Promise<Listing[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select(`*, seller:sellers(*), fits_vehicles:listing_fits_vehicles(make, model, year_from, year_to)`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getAllListings: ${error.message}`);
  return (data ?? []).map(rowToListing);
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select(`*, seller:sellers(*), fits_vehicles:listing_fits_vehicles(make, model, year_from, year_to)`)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getListingById: ${error.message}`);
  return data ? rowToListing(data) : undefined;
}

export async function getVehicles(): Promise<Vehicle[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("make, model, year")
    .order("make")
    .order("model")
    .order("year");

  if (error) throw new Error(`getVehicles: ${error.message}`);
  return (data ?? []).map((r) => ({ make: r.make, model: r.model, year: r.year }));
}

export async function getCompatibilityRules(): Promise<Record<string, CompatibilityRule[]>> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("compatibility_rules")
    .select("make, model, generation, year_from, year_to, notes")
    .order("make")
    .order("model")
    .order("year_from");

  if (error) throw new Error(`getCompatibilityRules: ${error.message}`);

  const rules: Record<string, CompatibilityRule[]> = {};
  for (const row of data ?? []) {
    const key = `${row.make}|${row.model}`;
    (rules[key] ??= []).push({
      generation: row.generation,
      yearFrom: row.year_from,
      yearTo: row.year_to,
      notes: row.notes ?? undefined,
    });
  }
  return rules;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToListing(row: any): Listing {
  return {
    id: row.id,
    input: {
      partType: row.part_type,
      make: row.make,
      model: row.model,
      yearFrom: row.year_from,
      yearTo: row.year_to,
      condition: row.condition,
      partNumber: row.part_number ?? undefined,
      notes: row.notes ?? undefined,
      price: row.price ?? undefined,
      images: row.images ?? [],
      hasReturnPolicy: row.has_return_policy ?? false,
    },
    generated: {
      title: row.title,
      description: row.description,
      conditionNotes: row.condition_notes,
      compatibilitySummary: row.compatibility_summary,
      keywords: row.keywords ?? [],
    },
    seller: {
      id: row.seller.id,
      name: row.seller.name,
      verified: row.seller.verified,
      rating: row.seller.rating ?? undefined,
      reviewCount: row.seller.review_count ?? undefined,
      location: row.seller.location ?? undefined,
    },
    fitsVehicles: (row.fits_vehicles ?? []).map((v: any) => ({
      make: v.make,
      model: v.model,
      yearFrom: v.year_from,
      yearTo: v.year_to,
    })),
    createdAt: row.created_at,
  };
}
