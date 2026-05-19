// POST /api/upload
// Body: multipart/form-data with field "images" (1-4 files)
// Response: { urls: string[] }
// Primary: Supabase Storage (listing-images bucket).
// Fallback: local filesystem at public/uploads/ when Storage isn't available
//           (no Docker storage service, or Supabase project without Storage).

import { NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { cookies } from "next/headers";
import { createSessionServerClient, createServerClient } from "@/lib/supabase";
import { checkImageHash, storeImageHash } from "@/lib/data";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 10 * 1024 * 1024;

// Returns the public URL after uploading to Supabase Storage.
// Throws if Storage is unavailable (schema missing, bucket error, etc.).
async function uploadToSupabase(
  buf: Buffer,
  ext: string,
  userId: string,
  contentType: string,
): Promise<string> {
  const supabase = createServerClient();

  // Ensure bucket exists — storage-api creates the schema on first boot.
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) throw new Error(listErr.message);
  if (!buckets?.find((b) => b.name === "listing-images")) {
    const { error: createErr } = await supabase.storage.createBucket("listing-images", { public: true });
    if (createErr) throw new Error(createErr.message);
  }

  const path = `${userId}/${randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("listing-images")
    .upload(path, buf, { contentType, upsert: false });
  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabase.storage
    .from("listing-images")
    .getPublicUrl(path);
  return publicUrl;
}

// Fallback: writes the file to public/uploads/ and returns a root-relative URL.
async function uploadToLocal(buf: Buffer, ext: string): Promise<string> {
  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(join(dir, filename), buf);
  return `/uploads/${filename}`;
}

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

  const urls: string[] = [];
  const hashes: string[] = [];
  const duplicates: { url: string; matchedUrl: string; matchedListingId: string | null }[] = [];

  for (const file of files) {
    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const bytes = await file.arrayBuffer();
    const buf = Buffer.from(bytes);

    // Compute SHA-256 fingerprint and check for prior uploads
    const hash = createHash("sha256").update(buf).digest("hex");
    const existing = await checkImageHash(hash);

    let publicUrl: string;
    try {
      publicUrl = await uploadToSupabase(buf, ext, user.id, file.type);
    } catch {
      publicUrl = await uploadToLocal(buf, ext);
    }

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
