// Data access layer — Stream 5 owns this.
// All functions are async and query Supabase. Swap the implementation here
// without touching call sites if you ever need a different backend.

import { createServerClient } from "@/lib/supabase";
import type { GeneratedListing, Listing, ListingInput, Vehicle } from "@/lib/types";

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

export async function createListing(
  input: ListingInput,
  generated: GeneratedListing,
  userId: string,
): Promise<Listing> {
  const supabase = createServerClient();
  const id = `lst_${Date.now()}`;

  // Upsert a seller record for this user if one doesn't exist yet
  const email = userId; // placeholder display name until profile editing exists
  const sellerId = `slr_${userId.slice(0, 8)}`;
  await supabase.from("sellers").upsert(
    { id: sellerId, name: email, verified: false, user_id: userId },
    { onConflict: "id", ignoreDuplicates: true },
  );

  const { error: listingError } = await supabase.from("listings").insert({
    id,
    seller_id: sellerId,
    user_id: userId,
    part_type: input.partType,
    make: input.make,
    model: input.model,
    year_from: input.yearFrom,
    year_to: input.yearTo,
    condition: input.condition,
    part_number: input.partNumber ?? null,
    notes: input.notes ?? null,
    price: input.price ?? null,
    images: input.images ?? [],
    has_return_policy: input.hasReturnPolicy ?? false,
    title: generated.title,
    description: generated.description,
    condition_notes: generated.conditionNotes,
    compatibility_summary: generated.compatibilitySummary,
    keywords: generated.keywords,
  });
  if (listingError) throw new Error(`createListing: ${listingError.message}`);

  const listing = await getListingById(id);
  if (!listing) throw new Error("createListing: could not retrieve inserted listing");
  return listing;
}

export async function updateListing(
  id: string,
  input: Partial<ListingInput & GeneratedListing>,
): Promise<void> {
  const supabase = createServerClient();
  const patch: Record<string, unknown> = {};
  if (input.partType !== undefined) patch.part_type = input.partType;
  if (input.make !== undefined) patch.make = input.make;
  if (input.model !== undefined) patch.model = input.model;
  if (input.yearFrom !== undefined) patch.year_from = input.yearFrom;
  if (input.yearTo !== undefined) patch.year_to = input.yearTo;
  if (input.condition !== undefined) patch.condition = input.condition;
  if (input.partNumber !== undefined) patch.part_number = input.partNumber;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.price !== undefined) patch.price = input.price;
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.conditionNotes !== undefined) patch.condition_notes = input.conditionNotes;
  if (input.compatibilitySummary !== undefined) patch.compatibility_summary = input.compatibilitySummary;
  if (input.keywords !== undefined) patch.keywords = input.keywords;
  const { error } = await supabase.from("listings").update(patch).eq("id", id);
  if (error) throw new Error(`updateListing: ${error.message}`);
}

// ── Seller profiles ──────────────────────────────────────────────────────────

export async function getSellerById(sellerId: string): Promise<import("@/lib/types").Seller | undefined> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .eq("id", sellerId)
    .maybeSingle();
  if (error) throw new Error(`getSellerById: ${error.message}`);
  if (!data) return undefined;
  return {
    id: data.id,
    name: data.name,
    verified: data.verified,
    rating: data.rating ?? undefined,
    reviewCount: data.review_count ?? undefined,
    location: data.location ?? undefined,
  };
}

export async function getListingsBySeller(sellerId: string): Promise<Listing[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select(`*, seller:sellers(*), fits_vehicles:listing_fits_vehicles(make, model, year_from, year_to)`)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getListingsBySeller: ${error.message}`);
  return (data ?? []).map(rowToListing);
}

// ── Saved listings ───────────────────────────────────────────────────────────
// All queries scope by user_id explicitly. RLS on the table denies anon/auth
// reads outright; service_role (the createServerClient below) bypasses RLS.
// The /api/saves/[id] route is responsible for verifying the user before
// calling any of these.

export async function saveListing(userId: string, listingId: string): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("saved_listings")
    .upsert(
      { user_id: userId, listing_id: listingId },
      { onConflict: "user_id,listing_id", ignoreDuplicates: true },
    );
  if (error) throw new Error(`saveListing: ${error.message}`);
}

export async function unsaveListing(userId: string, listingId: string): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("saved_listings")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);
  if (error) throw new Error(`unsaveListing: ${error.message}`);
}

export async function isListingSaved(userId: string, listingId: string): Promise<boolean> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("saved_listings")
    .select("user_id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();
  if (error) throw new Error(`isListingSaved: ${error.message}`);
  return data !== null;
}

export async function getSavedListingIds(userId: string): Promise<string[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("saved_listings")
    .select("listing_id")
    .eq("user_id", userId);
  if (error) throw new Error(`getSavedListingIds: ${error.message}`);
  return (data ?? []).map((r) => r.listing_id);
}

export async function getSavedListings(userId: string): Promise<Listing[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("saved_listings")
    .select(
      `created_at,
       listing:listings!inner(*, seller:sellers(*), fits_vehicles:listing_fits_vehicles(make, model, year_from, year_to))`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getSavedListings: ${error.message}`);
  // eslint-disable-next-line
  return (data ?? []).map((row: any) => rowToListing(row.listing));
}

// eslint-disable-next-line
function rowToListing(row: any): Listing {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
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
