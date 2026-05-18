import Link from "next/link";
import { Wrench } from "lucide-react";

export function Nav() {
  return (
    <header className="border-b">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Wrench className="h-5 w-5" />
          AutoReviver
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/listings" className="hover:underline">
            Browse
          </Link>
          <Link href="/sell" className="hover:underline">
            Sell a part
          </Link>
        </nav>
      </div>
    </header>
  );
}
