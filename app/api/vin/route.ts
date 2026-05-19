// GET /api/vin?vin=WVWZZZ3CZ...
// Decodes a 17-character VIN via the NHTSA vPIC API (free, no key required).
// Returns { make, model, year } on success, { error } on failure.
// NHTSA covers most North American and many European manufacturer VINs.

import { NextResponse } from "next/server";

const NHTSA = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevin";

// Title-cases a string: "VOLKSWAGEN" → "Volkswagen", "3 SERIES" → "3 Series"
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET(req: Request) {
  const vin = new URL(req.url).searchParams.get("vin")?.trim().toUpperCase();

  if (!vin) {
    return NextResponse.json({ error: "vin parameter is required" }, { status: 400 });
  }
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return NextResponse.json(
      { error: "VIN must be 17 characters (letters A–Z except I, O, Q — and digits)" },
      { status: 400 }
    );
  }

  let nhtsaData: { Results: { Variable: string; Value: string | null }[] };
  try {
    const res = await fetch(`${NHTSA}/${vin}?format=json`, {
      next: { revalidate: 3600 }, // cache decoded VINs for 1 hour
    });
    if (!res.ok) throw new Error(`NHTSA returned ${res.status}`);
    nhtsaData = await res.json();
  } catch (err) {
    console.error("NHTSA VIN decode failed:", err);
    return NextResponse.json({ error: "VIN decode service unavailable" }, { status: 502 });
  }

  const get = (variable: string) =>
    nhtsaData.Results.find((r) => r.Variable === variable)?.Value ?? null;

  const rawMake = get("Make");
  const rawModel = get("Model");
  const rawYear = get("Model Year");

  if (!rawMake || !rawModel || !rawYear) {
    return NextResponse.json(
      { error: "Could not decode this VIN — make, model, or year missing" },
      { status: 422 }
    );
  }

  const year = Number(rawYear);
  if (!year) {
    return NextResponse.json({ error: "Invalid model year in VIN response" }, { status: 422 });
  }

  return NextResponse.json({
    make: titleCase(rawMake),
    model: titleCase(rawModel),
    year,
    raw: { make: rawMake, model: rawModel, year: rawYear },
  });
}
