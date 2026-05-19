// Dark AutoReviver header used on every page. Renders auth-aware nav:
// logged out → Log in + Sign up buttons; logged in → user email + Sign out
// + a "Saved" link in the main nav.

import Link from "next/link";
import { cookies } from "next/headers";
import { createSessionServerClient } from "@/lib/supabase";
import { isSupabaseAuthCookieName } from "@/lib/supabase-cookies";
import { getOwnProfile } from "@/lib/data";
import { LogoutButton } from "@/components/logout-button";

export async function SiteHeader() {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore
    .getAll()
    .some(({ name }) => isSupabaseAuthCookieName(name));

  let userId: string | null = null;

  if (hasAuthCookie) {
    const supabase = createSessionServerClient(cookieStore);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error) userId = data.user?.id ?? null;
    } catch {
      userId = null;
    }
  }

  const profile = userId ? await getOwnProfile(userId).catch(() => null) : null;

  return (
    <header className="site-header">
      <nav className="navbar">
        <Link href="/" className="logo-link">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/AutoReviver_logo.png" alt="AutoReviver" className="logo" />
        </Link>

        <ul className="nav-links">
          <li><Link href="/listings">Browse</Link></li>
          <li><Link href="/sell">Sell</Link></li>
          <li><Link href="/discover">Discover</Link></li>
          {userId && <li><Link href="/saved">Saved</Link></li>}
        </ul>

        {userId ? (
          <div className="nav-auth">
            {profile ? (
              <Link href={`/profile/${profile.username}`} className="nav-user-email">
                @{profile.username}
              </Link>
            ) : null}
            <LogoutButton />
          </div>
        ) : (
          <div className="nav-auth">
            <Link href="/login" className="nav-btn-outline">Log in</Link>
            <Link href="/login?mode=signup" className="nav-btn">Sign up</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
