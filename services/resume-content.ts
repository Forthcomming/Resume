import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  normalizeResumeContent,
  type ResumeContent,
} from "@/lib/resume/content";
import {
  getSectionOrder,
  parseSectionSubVersionsStore,
  sanitizeSectionSubVersionsStore,
  type SectionSubVersionsStore,
} from "@/lib/resume/versions";
import { getCurrentUserId } from "@/lib/auth/user";
import { canPersistToCloud, isCloudSyncEnabled } from "@/lib/storage/mode";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface ResumeWorkspace {
  content: ResumeContent | null;
  versionStore: SectionSubVersionsStore | null;
  updatedAt: string | null;
}

/**
 * Read structured content for a resume from cloud (RLS).
 * Returns null in local-first mode (client uses localStorage).
 */
export async function getResumeContent(
  id: string
): Promise<ResumeContent | null> {
  const workspace = await getResumeWorkspace(id);
  return workspace?.content ?? null;
}

/**
 * Read content + version_store + updated_at for editor hydration.
 */
export async function getResumeWorkspace(
  id: string
): Promise<ResumeWorkspace | null> {
  if (!isCloudSyncEnabled() || !isSupabaseConfigured) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("resumes")
    .select("content, version_store, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    content: normalizeResumeContent(data.content as Partial<ResumeContent>),
    versionStore: parseSectionSubVersionsStore(data.version_store),
    updatedAt:
      typeof data.updated_at === "string" ? data.updated_at : null,
  };
}

/**
 * Persist structured content via the user session (RLS).
 * Prefer saveResumeWorkspace when version store is available.
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

/**
 * Persist composed content + full version store + section_order in one write.
 */
export async function saveResumeWorkspace(
  id: string,
  content: ResumeContent,
  versionStore: SectionSubVersionsStore
): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!canPersistToCloud(userId)) return false;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return false;

  const sanitized = sanitizeSectionSubVersionsStore(versionStore);

  const { error } = await supabase
    .from("resumes")
    .update({
      content,
      version_store: sanitized,
      section_order: getSectionOrder(sanitized),
    })
    .eq("id", id);

  return !error;
}
