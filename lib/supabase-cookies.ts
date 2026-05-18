export const SUPABASE_AUTH_COOKIE_NAME = "sb-autoreviver-auth-token";

export function isSupabaseAuthCookieName(name: string) {
  return (
    name === SUPABASE_AUTH_COOKIE_NAME ||
    name.startsWith(`${SUPABASE_AUTH_COOKIE_NAME}.`)
  );
}
