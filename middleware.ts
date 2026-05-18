import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseAuthCookieName, SUPABASE_AUTH_COOKIE_NAME } from "@/lib/supabase-cookies";

// Middleware runs server-side inside the `app` container, so it must reach
// Supabase via the internal Docker network (http://kong:8000) — NOT via
// NEXT_PUBLIC_SUPABASE_URL (= http://localhost:8000), which would resolve to
// the container itself and hang/fail every request.
function supabaseUrl() {
  return process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = supabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return response;

  const hasAuthCookie = request.cookies
    .getAll()
    .some(({ name }) => isSupabaseAuthCookieName(name));

  if (!hasAuthCookie) return response;

  const supabase = createServerClient(
    url,
    key,
    {
      cookieOptions: {
        name: SUPABASE_AUTH_COOKIE_NAME,
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (pairs) => {
          pairs.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          pairs.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Refresh session — keeps JWT alive
  try {
    await supabase.auth.getUser();
  } catch {
    // If local Supabase is still starting or temporarily unreachable, keep the
    // request alive. Authenticated pages still validate the user server-side.
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
