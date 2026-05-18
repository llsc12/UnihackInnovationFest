// GET  /api/profile  — return own profile (owner only)
// POST /api/profile  — create profile on registration
// PATCH /api/profile — update username, full name, privacy mode (DOB is immutable)

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionServerClient } from "@/lib/supabase";
import { createProfile, getOwnProfile, updateProfile } from "@/lib/data";
import type { PrivacyMode } from "@/lib/types";

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createSessionServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const profile = await getOwnProfile(user.id);
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    return NextResponse.json(profile);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { username, fullName, dateOfBirth, privacyMode } = await req.json();

    if (!username || !fullName || !dateOfBirth || !privacyMode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!["public", "private"].includes(privacyMode)) {
      return NextResponse.json({ error: "Invalid privacyMode" }, { status: 400 });
    }

    await createProfile(user.id, {
      username: String(username).toLowerCase(),
      fullName: String(fullName),
      dateOfBirth: String(dateOfBirth),
      privacyMode: privacyMode as PrivacyMode,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const msg = String(err);
    // Unique constraint violation on username
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { username, fullName, privacyMode } = await req.json();

    if (privacyMode !== undefined && !["public", "private"].includes(privacyMode)) {
      return NextResponse.json({ error: "Invalid privacyMode" }, { status: 400 });
    }

    await updateProfile(user.id, {
      username: username !== undefined ? String(username).toLowerCase() : undefined,
      fullName: fullName !== undefined ? String(fullName) : undefined,
      privacyMode: privacyMode as PrivacyMode | undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
