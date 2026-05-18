// Shared types used across all 5 work streams.
// If you change a type here, ping the channel — it likely affects another stream.

export type Condition = "new" | "like-new" | "good" | "fair" | "for-parts";
export type PartOrigin = "oem" | "aftermarket" | "unknown";
export type PrivacyMode = "public" | "private";

export interface Vehicle {
  make: string;
  model: string;
  year: number;
}

export interface VehicleRange {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
}

export interface Seller {
  id: string;
  name: string;
  verified: boolean;
  rating?: number;
  reviewCount?: number;
  location?: string;
  // Profile fields — present when the seller has a profile (may be absent for seed data)
  username?: string;
  fullName?: string | null;  // null when privacyMode === 'private'
  memberSince?: string;      // ISO date string
  profileUrl?: string;       // /profile/[username]
}

// Input from the seller form, before AI/template generation runs.
export interface ListingInput {
  partType: string;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  condition: Condition;
  partNumber?: string;
  notes?: string;
  price?: number;
  images?: string[];
  hasReturnPolicy?: boolean;
  returnPolicyDetails?: string;
  postageInfo?: string;
  partOrigin?: PartOrigin;
}

// Output from the listing generator (lib/listing-generator.ts).
export interface GeneratedListing {
  title: string;
  description: string;
  conditionNotes: string;
  compatibilitySummary: string;
  keywords: string[];
}

// A full listing as stored in data/listings.json and returned by the API.
export interface Listing {
  id: string;
  userId?: string;
  input: ListingInput;
  generated: GeneratedListing;
  seller: Seller;
  fitsVehicles: VehicleRange[]; // explicit compat envelope for this listing
  createdAt: string; // ISO date
}

// Compatibility checker output (lib/compatibility.ts).
export type CompatibilityVerdict = "compatible" | "maybe" | "not-compatible";

export interface CompatibilityResult {
  verdict: CompatibilityVerdict;
  confidence: number; // 0..1
  reasons: string[]; // human-readable explanation lines
}

// Trust score output (lib/trust-score.ts).
export interface TrustScoreResult {
  score: number; // 0..100
  band: "low" | "medium" | "high";
  signals: TrustSignal[];
}

export interface TrustSignal {
  key: string;
  label: string;
  weight: number; // max contribution to the score
  passed: boolean;
  partial?: boolean; // true when graduated score is between 0 and weight
}

// Search query + result (lib/search.ts).
export interface SearchQuery {
  q?: string;
  make?: string;
  model?: string;
  year?: number;
  partType?: string;
  condition?: Condition;
  priceMin?: number;
  priceMax?: number;
  verifiedOnly?: boolean;
}

export interface SearchResult {
  listing: Listing;
  score: number; // relevance
}

// ── User profile types ────────────────────────────────────────────────────────

// Safe to send to any client — no DOB, no email.
export interface PublicProfile {
  id: string;           // UUID, needed to look up listings
  username: string;
  fullName: string | null;  // null when privacyMode === 'private'
  memberSince: string;      // ISO date string
}

// Only ever returned to the profile owner.
export interface OwnProfile {
  id: string;
  username: string;
  fullName: string;
  dateOfBirth: string;  // ISO date — never send to other users
  privacyMode: PrivacyMode;
  memberSince: string;
  email: string;        // from auth.users — never send to other users
}
