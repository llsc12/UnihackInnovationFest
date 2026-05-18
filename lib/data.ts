// Data access layer — Stream 5 owns this.
// All functions are async and query Supabase. Swap the implementation here
// without touching call sites if you ever need a different backend.

import { createServerClient } from "@/lib/supabase";
import type {
  GeneratedListing,
  Listing,
  ListingInput,
  OwnProfile,
  PartOrigin,
  PrivacyMode,
  PublicProfile,
  Vehicle,
} from "@/lib/types";

export interface CompatibilityRule {
  generation: string;
  yearFrom: number;
  yearTo: number;
  notes?: string;
}

// ── Listings ──────────────────────────────────────────────────────────────────

const LISTING_SELECT = `
  *,
  seller:sellers(*),
  fits_vehicles:listing_fits_vehicles(make, model, year_from, year_to),
  profile:profiles(username, full_name, privacy_mode, created_at)
`.trim();

export async function getAllListings(): Promise<Listing[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getAllListings: ${error.message}`);
  return (data ?? []).map(rowToListing);
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getListingById: ${error.message}`);
  return data ? rowToListing(data) : undefined;
}

export async function getListingsByUser(userId: string): Promise<Listing[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getListingsByUser: ${error.message}`);
  return (data ?? []).map(rowToListing);
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

  // Derive a display name for the seller record from their profile if available
  const profile = await getOwnProfile(userId);
  const sellerName =
    profile
      ? profile.privacyMode === "public"
        ? profile.fullName
        : profile.username
      : userId;

  const sellerId = `slr_${userId.slice(0, 8)}`;
  await supabase.from("sellers").upsert(
    { id: sellerId, name: sellerName, verified: false, user_id: userId },
    { onConflict: "id", ignoreDuplicates: false },
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
    return_policy_details: input.returnPolicyDetails ?? null,
    postage_info: input.postageInfo ?? null,
    part_origin: input.partOrigin ?? "unknown",
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
  if (input.hasReturnPolicy !== undefined) patch.has_return_policy = input.hasReturnPolicy;
  if (input.returnPolicyDetails !== undefined) patch.return_policy_details = input.returnPolicyDetails;
  if (input.postageInfo !== undefined) patch.postage_info = input.postageInfo;
  if (input.partOrigin !== undefined) patch.part_origin = input.partOrigin;
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.conditionNotes !== undefined) patch.condition_notes = input.conditionNotes;
  if (input.compatibilitySummary !== undefined) patch.compatibility_summary = input.compatibilitySummary;
  if (input.keywords !== undefined) patch.keywords = input.keywords;
  const { error } = await supabase.from("listings").update(patch).eq("id", id);
  if (error) throw new Error(`updateListing: ${error.message}`);
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

// ── Profiles ──────────────────────────────────────────────────────────────────

// Returns public-safe profile data for any user. Never includes DOB or email.
export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, privacy_mode, created_at")
    .eq("username", username)
    .maybeSingle();

  if (error) throw new Error(`getPublicProfile: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    username: data.username,
    fullName: data.privacy_mode === "public" ? data.full_name : null,
    memberSince: data.created_at,
  };
}

// Returns full profile including DOB and email — only ever call this for the
// authenticated user themselves, never for rendering other users' pages.
export async function getOwnProfile(userId: string): Promise<OwnProfile | null> {
  const supabase = createServerClient();

  const [profileRes, userRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, full_name, date_of_birth, privacy_mode, created_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase.auth.admin.getUserById(userId),
  ]);

  if (profileRes.error) throw new Error(`getOwnProfile: ${profileRes.error.message}`);
  if (!profileRes.data) return null;

  const p = profileRes.data;
  return {
    id: userId,
    username: p.username,
    fullName: p.full_name,
    dateOfBirth: p.date_of_birth,
    privacyMode: p.privacy_mode as PrivacyMode,
    memberSince: p.created_at,
    email: userRes.data.user?.email ?? "",
  };
}

export async function createProfile(
  userId: string,
  data: { username: string; fullName: string; dateOfBirth: string; privacyMode: PrivacyMode },
): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase.from("profiles").insert({
    id: userId,
    username: data.username,
    full_name: data.fullName,
    date_of_birth: data.dateOfBirth,
    privacy_mode: data.privacyMode,
  });
  if (error) throw new Error(`createProfile: ${error.message}`);
}

export async function updateProfile(
  userId: string,
  patch: { username?: string; fullName?: string; privacyMode?: PrivacyMode },
): Promise<void> {
  const supabase = createServerClient();
  const update: Record<string, unknown> = {};
  if (patch.username !== undefined) update.username = patch.username;
  if (patch.fullName !== undefined) update.full_name = patch.fullName;
  if (patch.privacyMode !== undefined) update.privacy_mode = patch.privacyMode;
  const { error } = await supabase.from("profiles").update(update).eq("id", userId);
  if (error) throw new Error(`updateProfile: ${error.message}`);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

// eslint-disable-next-line
function rowToListing(
  row: any,
  prof: { username: string; full_name: string; privacy_mode: string; created_at: string } | null = null,
): Listing {
  const isPublic = prof?.privacy_mode === "public";

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
      returnPolicyDetails: row.return_policy_details ?? undefined,
      postageInfo: row.postage_info ?? undefined,
      partOrigin: (row.part_origin ?? "unknown") as PartOrigin,
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
      ...(prof
        ? {
            username: prof.username,
            fullName: isPublic ? prof.full_name : null,
            memberSince: prof.created_at,
            profileUrl: `/profile/${prof.username}`,
          }
        : {}),
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
