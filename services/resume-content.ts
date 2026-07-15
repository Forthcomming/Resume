import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  normalizeResumeContent,
  type ResumeContent,
} from "@/lib/resume/content";
import { getCurrentUserId } from "@/lib/auth/user";
import { canPersistToCloud, isCloudSyncEnabled } from "@/lib/storage/mode";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Read structured content for a resume from cloud (RLS).
 * Returns null in local-first mode (client uses localStorage).
 */
export async function getResumeContent(
  id: string
): Promise<ResumeContent | null> {
  if (!isCloudSyncEnabled() || !isSupabaseConfigured) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("resumes")
    .select("content")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return normalizeResumeContent(data.content as Partial<ResumeContent>);
}

/**
 * Persist structured content via the user session (RLS).
 */
export async function saveResumeContent(
  id: string,
  content: ResumeContent
): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!canPersistToCloud(userId)) return false;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("resumes")
    .update({ content })
    .eq("id", id);

  return !error;
}
