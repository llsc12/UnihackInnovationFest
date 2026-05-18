// STREAM 1 — Seller listing creation flow.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { SellForm } from "./sell-form";

export default async function SellPage() {
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">List a part</h1>
        <p className="text-muted-foreground">
          Fill in the basics. AutoReviver will turn it into a clean, structured listing.
        </p>
      </header>
      {user ? (
        <SellForm />
      ) : (
        <p className="text-muted-foreground">
          You need to{" "}
          <Link href="/login" className="underline text-foreground">sign in</Link>
          {" "}before you can post a listing.
        </p>
      )}
    </div>
  );
}
