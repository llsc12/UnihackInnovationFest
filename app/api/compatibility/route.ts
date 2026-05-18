// STREAM 2 — POST /api/compatibility
// Body: { listingId: string, vehicle: Vehicle }   Response: CompatibilityResult

import { NextResponse } from "next/server";
import { checkCompatibility } from "@/lib/compatibility";
import { getListingById } from "@/lib/data";
import type { Vehicle } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { listingId, vehicle } = (await req.json()) as {
      listingId: string;
      vehicle: Vehicle;
    };

    if (!listingId || !vehicle?.make || !vehicle?.model || !vehicle?.year) {
      return NextResponse.json(
        { error: "listingId and vehicle.{make,model,year} are required" },
        { status: 400 }
      );
    }

    const listing = await getListingById(listingId);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const result = checkCompatibility(listing, vehicle);
    return NextResponse.json(result);
  } catch (err) {
    console.error("compatibility check failed:", err);
    return NextResponse.json({ error: "Failed to check compatibility" }, { status: 500 });
  }
}
