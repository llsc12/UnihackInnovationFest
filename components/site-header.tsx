// Dark AutoReviver header used on every page. Renders auth-aware nav:
// logged out → Log in + Sign up buttons; logged in → user email + Sign out
// + a "Saved" link in the main nav.

import Link from "next/link";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { createSessionServerClient } from "@/lib/supabase";
import { isSupabaseAuthCookieName } from "@/lib/supabase-cookies";
import { LogoutButton } from "@/components/logout-button";

export async function SiteHeader() {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore
    .getAll()
    .some(({ name }) => isSupabaseAuthCookieName(name));

  let user: User | null = null;

  if (hasAuthCookie) {
    const supabase = createSessionServerClient(cookieStore);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error) user = data.user;
    } catch {
      user = null;
    }
  }

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
          {user && <li><Link href="/saved">Saved</Link></li>}
        </ul>

        {user ? (
          <div className="nav-auth">
            <span className="nav-user-email" title={user.email ?? ""}>{user.email}</span>
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
