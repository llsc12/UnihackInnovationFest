import type { User } from "@supabase/supabase-js";
import type { cookies } from "next/headers";
import { isSupabaseAuthCookieName } from "@/lib/supabase-cookies";
import { createSessionServerClient } from "@/lib/supabase";

export async function getCurrentUser(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<User | null> {
  const hasAuthCookie = cookieStore
    .getAll()
    .some(({ name }) => isSupabaseAuthCookieName(name));

  if (!hasAuthCookie) return null;

  try {
    const supabase = createSessionServerClient(cookieStore);
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  } catch {
    return null;
  }
}
