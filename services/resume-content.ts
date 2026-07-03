import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  normalizeResumeContent,
  type ResumeContent,
} from "@/lib/resume/content";

/**
 * Read structured content for a resume.
 * Returns null when Supabase is not configured (client falls back to localStorage).
 */
export async function getResumeContent(
  id: string
): Promise<ResumeContent | null> {
  const supabase = getSupabaseServerClient();
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
 * Persist structured content for a resume using the service-role client.
 * Returns false when Supabase is not configured.
 */
export async function saveResumeContent(
  id: string,
  content: ResumeContent
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("resumes")
    .update({ content })
    .eq("id", id);

  return !error;
}
