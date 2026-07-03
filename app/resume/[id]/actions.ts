"use server";

import { saveResumeContent } from "@/services/resume-content";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ResumeContent } from "@/lib/resume/content";

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
