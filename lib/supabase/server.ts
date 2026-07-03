import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

let cached: SupabaseClient | null = null;

/**
 * Public (anon) Supabase client for server components / read paths.
 * Returns null when env is not configured so callers can fall back to seed data.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (cached) return cached;
  cached = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
  return cached;
}
