export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Whether the server-side Supabase environment is fully configured.
 * When false, services fall back to local seed data so the app still runs.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseServiceRoleKey
);
