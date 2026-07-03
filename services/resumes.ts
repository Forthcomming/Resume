import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { rowToResume, type ResumeRow, DEMO_USER_ID } from "@/lib/resume/schema";
import { seedResumes } from "@/lib/resume/seed";
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

/**
 * List a user's resumes, newest first.
 * Falls back to local seed data when Supabase is not configured or errors.
 */
export async function listResumes(userId: string): Promise<Resume[]> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [...seedResumes].sort(byUpdatedDesc);
  }

  const { data, error } = await supabase
    .from("resumes")
    .select("id, user_id, title, created_at, updated_at, section_order, tags")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [...seedResumes].sort(byUpdatedDesc);
  }

  return (data as ResumeRow[]).map(rowToResume);
}

/**
 * Fetch a single resume by id.
 * Falls back to local seed data when Supabase is not configured or errors.
 */
export async function getResume(id: string): Promise<Resume | null> {
  const supabase = getSupabaseServerClient();

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
 * Create a new resume row (used by the parse/import flow).
 * Returns the new id, or null when Supabase is not configured
 * (caller falls back to a client-generated id + localStorage).
 */
export async function createResume(
  title: string,
  content: ResumeContent
): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: DEMO_USER_ID,
      title,
      section_order: DEFAULT_SECTION_ORDER,
      tags: [],
      content,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id as string;
}

function byUpdatedDesc(a: Resume, b: Resume): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}
