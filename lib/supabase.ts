import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSSRServer, createBrowserClient as createSSRBrowser } from "@supabase/ssr";
import type { cookies } from "next/headers";
import { SUPABASE_AUTH_COOKIE_NAME } from "@/lib/supabase-cookies";

function supabaseUrl() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) must be set.");
  return url;
}

// Cookie names are derived from the public URL hostname (what the browser uses).
// In Docker the server calls a different internal URL, so we pin the storageKey
// to the public hostname so browser-written cookies are found server-side.
function authStorageKey() {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `sb-${new URL(publicUrl).hostname}-auth-token`;
}

// ── Service-role client (bypasses RLS) ────────────────────────────────────────
// Server-side only — never ship this key to the browser.
export function createServerClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set.");
  return createClient(supabaseUrl(), key, { auth: { persistSession: false } });
}

// ── Session-aware server client (respects RLS, reads cookies) ─────────────────
// Pass the Next.js `cookies()` store from a Server Component or Route Handler.
// Prefers SUPABASE_URL so that inside Docker the container can reach Kong on
// the internal network (http://kong:8000), and falls back to NEXT_PUBLIC_URL
// when running outside Docker.
export function createSessionServerClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const url = supabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  return createSSRServer(url, key, {
    cookieOptions: {
      name: SUPABASE_AUTH_COOKIE_NAME,
    },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (pairs) => {
        try {
          pairs.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component — cookie writes are ignored, middleware handles refresh
        }
      },
    },
    auth: { storageKey: authStorageKey() },
  });
}

// ── Browser client (anon key, subject to RLS) ─────────────────────────────────
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  return createSSRBrowser(url, key, {
    cookieOptions: {
      name: SUPABASE_AUTH_COOKIE_NAME,
    },
  });
}
