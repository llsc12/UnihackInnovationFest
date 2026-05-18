"use client";

import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button onClick={logout} className="hover:underline text-sm">
      Sign out
    </button>
  );
}
