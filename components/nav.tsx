import Link from "next/link";
import { Wrench } from "lucide-react";
import { cookies } from "next/headers";
import { createSessionServerClient } from "@/lib/supabase";
import { LogoutButton } from "./logout-button";

export async function Nav() {
  const cookieStore = await cookies();
  const supabase = createSessionServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="border-b">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Wrench className="h-5 w-5" />
          AutoReviver
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/listings" className="hover:underline">Browse</Link>
          <Link href="/sell" className="hover:underline">Sell a part</Link>
          {user ? (
            <>
              <span className="text-muted-foreground truncate max-w-[160px]">{user.email}</span>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="hover:underline">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
