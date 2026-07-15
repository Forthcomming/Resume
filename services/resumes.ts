import { getSupabaseServerClient } from "@/lib/supabase/server";
import { rowToResume, type ResumeRow } from "@/lib/resume/schema";
import { seedResumes } from "@/lib/resume/seed";
import { getCurrentUserId } from "@/lib/auth/user";
import { canPersistToCloud, isCloudSyncEnabled } from "@/lib/storage/mode";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Resume } from "@/types/resume";
import type { ResumeContent } from "@/lib/resume/content";

const DEFAULT_SECTION_ORDER = [
  "basic_info",
  "summary",
  "work",
  "education",
  "project",
  "skills",
];

function byUpdatedDesc(a: Resume, b: Resume): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function demoList(): Resume[] {
  return [...seedResumes].sort(byUpdatedDesc);
}

/**
 * List resumes for the current viewer.
 * Signed-in (incl. anonymous): cloud rows for auth.uid().
 * Offline / no Auth: demo seed cards (merged with localStorage on client).
 */
export async function listResumesForCurrentUser(): Promise<Resume[]> {
  const userId = await getCurrentUserId();
  if (!canPersistToCloud(userId)) {
    return demoList();
  }
  return listResumes(userId!);
}

/**
 * List a user's resumes, newest first.
 * Empty array when cloud query fails for a signed-in user (no shared DEMO leak).
 */
export async function listResumes(userId: string): Promise<Resume[]> {
  if (!isCloudSyncEnabled() || !isSupabaseConfigured) {
    return demoList();
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("resumes")
    .select("id, user_id, title, created_at, updated_at, section_order, tags")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    console.error("[resumes] list failed", error?.message);
    return [];
  }

  return (data as ResumeRow[]).map(rowToResume);
}

/**
 * Fetch a single resume by id (RLS-scoped for signed-in users).
 */
export async function getResume(id: string): Promise<Resume | null> {
  if (!isCloudSyncEnabled() || !isSupabaseConfigured) {
    return seedResumes.find((r) => r.id === id) ?? null;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return seedResumes.find((r) => r.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from("resumes")
    .select("id, user_id, title, created_at, updated_at, section_order, tags")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return seedResumes.find((r) => r.id === id) ?? null;
  }

  return rowToResume(data as ResumeRow);
}

/**
 * Create a resume under auth.uid() via the session client (RLS).
 * Returns null when not signed in / cloud off (caller uses localStorage).
 */
export async function createResume(
  title: string,
  content: ResumeContent
): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!canPersistToCloud(userId)) return null;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      title,
      section_order: DEFAULT_SECTION_ORDER,
      tags: [],
      content,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[resumes] create failed", error?.message);
    return null;
  }
  return data.id as string;
}

/** Update resume title (RLS). */
export async function updateResumeTitle(
  id: string,
  title: string
): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!canPersistToCloud(userId)) return false;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return false;

  const trimmed = title.trim();
  if (!trimmed) return false;

  const { error } = await supabase
    .from("resumes")
    .update({ title: trimmed, updated_at: new Date().toISOString() })
    .eq("id", id);

  return !error;
}
