// POST /api/upload
// Body: multipart/form-data with field "images" (1-4 files)
// Response: { urls: string[] }

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 10 * 1024 * 1024;
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function POST(req: Request) {
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
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `"${file.name}" exceeds the 10 MB limit` },
        { status: 400 }
      );
    }
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = `${randomUUID()}.${ext}`;
    const bytes = await file.arrayBuffer();
    await writeFile(join(UPLOAD_DIR, filename), Buffer.from(bytes));
    urls.push(`/uploads/${filename}`);
  }

  return NextResponse.json({ urls });
}
