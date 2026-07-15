import { getSupabaseServerClient } from "@/lib/supabase/server";

export { LOCAL_GUEST_USER_ID } from "@/lib/auth/constants";

/**
 * Signed-in user id from Supabase Auth (including anonymous), or null.
 * Server-only — do not import from client components.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}
