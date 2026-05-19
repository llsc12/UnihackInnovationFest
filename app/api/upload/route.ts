// POST /api/upload
// Body: multipart/form-data with field "images" (1-4 files)
// Response: { urls: string[] }
// Images are stored in Supabase Storage under listing-images/{userId}/{uuid}.{ext}

import { NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import { cookies } from "next/headers";
import { createSessionServerClient, createServerClient } from "@/lib/supabase";
import { checkImageHash, storeImageHash } from "@/lib/data";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(req: Request) {
  // Require authentication
  const cookieStore = await cookies();
  const sessionClient = createSessionServerClient(cookieStore);
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const files = formData.getAll("images") as File[];

  if (files.length < 1 || files.length > 4) {
    return NextResponse.json({ error: "Upload between 1 and 4 images" }, { status: 400 });
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `"${file.name}" must be jpg, png, or webp` },
        { status: 400 },
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `"${file.name}" exceeds the 10 MB limit` },
        { status: 400 },
      );
    }
  }

  const supabase = createServerClient();

  // Ensure the bucket exists (storage-api creates the schema on first boot,
  // so the bucket row may not have been inserted by the DB init script yet)
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find((b) => b.name === "listing-images")) {
    await supabase.storage.createBucket("listing-images", { public: true });
  }

  const urls: string[] = [];
  const hashes: string[] = [];
  const duplicates: { url: string; matchedUrl: string; matchedListingId: string | null }[] = [];

  for (const file of files) {
    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const path = `${user.id}/${randomUUID()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buf = Buffer.from(bytes);

    // Compute SHA-256 fingerprint and check for prior uploads
    const hash = createHash("sha256").update(buf).digest("hex");
    const existing = await checkImageHash(hash);

    const { error } = await supabase.storage
      .from("listing-images")
      .upload(path, buf, { contentType: file.type, upsert: false });

    if (error) {
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from("listing-images")
      .getPublicUrl(path);

    urls.push(publicUrl);
    hashes.push(hash);

    if (existing) {
      duplicates.push({ url: publicUrl, matchedUrl: existing.imageUrl, matchedListingId: existing.listingId });
    } else {
      await storeImageHash(hash, publicUrl);
    }
  }

  return NextResponse.json({ urls, hashes, duplicates });
}
