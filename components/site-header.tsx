// Dark AutoReviver header used on / and /discover.

import Link from "next/link";

export function SiteHeader() {
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
        </ul>
        <Link href="/listings" className="nav-btn">Get Started</Link>
      </nav>
    </header>
  );
}
