import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Storage mode for ResumeKit.
 *
 * With Anonymous Auth: signed-in users persist resumes under auth.uid() + RLS.
 * Kill switch: NEXT_PUBLIC_CLOUD_SYNC=false forces local-only.
 */
export function isCloudSyncEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CLOUD_SYNC !== "false";
}

/** Whether we may read/write cloud resumes for this user. */
export function canPersistToCloud(
  userId: string | null | undefined
): boolean {
  return isCloudSyncEnabled() && isSupabaseConfigured && Boolean(userId);
}
