"use server";

import {
  saveResumeContent,
  saveResumeWorkspace,
} from "@/services/resume-content";
import { updateResumeTitle } from "@/services/resumes";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ResumeContent } from "@/lib/resume/content";
import type { SectionSubVersionsStore } from "@/lib/resume/versions";

export async function saveResumeContentAction(
  id: string,
  content: ResumeContent
): Promise<{ ok: boolean; configured: boolean }> {
  if (!isSupabaseConfigured) {
    return { ok: false, configured: false };
  }
  const ok = await saveResumeContent(id, content);
  return { ok, configured: true };
}

export async function saveResumeWorkspaceAction(
  id: string,
  content: ResumeContent,
  versionStore: SectionSubVersionsStore
): Promise<{ ok: boolean; configured: boolean }> {
  if (!isSupabaseConfigured) {
    return { ok: false, configured: false };
  }
  const ok = await saveResumeWorkspace(id, content, versionStore);
  return { ok, configured: true };
}

export async function updateResumeTitleAction(
  id: string,
  title: string
): Promise<{ ok: boolean; configured: boolean }> {
  if (!isSupabaseConfigured) {
    return { ok: false, configured: false };
  }
  const ok = await updateResumeTitle(id, title.trim());
  return { ok, configured: true };
}
