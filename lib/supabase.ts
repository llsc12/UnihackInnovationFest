import { createClient } from "@supabase/supabase-js";

// Server-side client — uses service role key, bypasses RLS.
// Only call from API routes and Server Components (never ship this key to the browser).
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. " +
        "Copy .env.example → .env.local and fill in your Supabase project values."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// Browser-side client — uses anon key, subject to RLS.
// Safe to import in Client Components.
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
    );
  }
  return createClient(url, key);
}
