// GET /api/dvla?reg=AP02HTG
// Dummy DVLA vehicle enquiry endpoint for demonstration purposes.
// Recognises a hardcoded plate; returns 404 for anything else.

import { NextResponse } from "next/server";

const DEMO_VEHICLES: Record<string, { make: string; model: string; year: number; colour: string }> = {
  "AP02HTG": { make: "Mini", model: "Cooper", year: 2002, colour: "Red" },
};

function normalise(plate: string): string {
  return plate.replace(/\s+/g, "").toUpperCase();
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("reg")?.trim() ?? "";

  if (!raw) {
    return NextResponse.json({ error: "reg parameter is required" }, { status: 400 });
  }

  const key = normalise(raw);
  const vehicle = DEMO_VEHICLES[key];

  if (!vehicle) {
    return NextResponse.json(
      { error: "Vehicle not found — registration not recognised" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    registration: key,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    colour: vehicle.colour,
  });
}
