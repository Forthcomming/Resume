import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseServiceRoleKey, supabaseUrl } from "./env";

let cached: SupabaseClient | null = null;

/**
 * Service-role Supabase client for trusted server-side writes.
 * NEVER import this from client components. Returns null when not configured.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;
  if (cached) return cached;
  cached = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
