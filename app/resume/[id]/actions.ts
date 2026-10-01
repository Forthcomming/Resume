"use server";

import {
  saveResumeContent,
  saveResumeWorkspace,
} from "@/services/resume-content";
import {
  createResumeWorkspace,
  deleteResume,
  getResume,
  updateResumeTitle,
} from "@/services/resumes";
import { getResumeWorkspace } from "@/services/resume-content";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { buildTailoredWorkspace } from "@/lib/resume/tailored-copy";
import type { ResumeContent } from "@/lib/resume/content";
import type { SectionSubVersionsStore } from "@/lib/resume/versions";
import type {
  JdAdaptationPlan,
  SelectedTailoringActions,
} from "@/types/jd-tailoring";

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

export async function deleteResumeAction(
  id: string
): Promise<{ ok: boolean; configured: boolean }> {
  if (!isSupabaseConfigured) {
    return { ok: false, configured: false };
  }
  const ok = await deleteResume(id);
  return { ok, configured: true };
}

export async function createTailoredResumeAction(input: {
  sourceResumeId: string;
  plan: JdAdaptationPlan;
  selected: SelectedTailoringActions;
  outputTitle: string;
}): Promise<{
  ok: boolean;
  configured: boolean;
  id?: string;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { ok: false, configured: false };
  }

  const [resume, workspace] = await Promise.all([
    getResume(input.sourceResumeId),
    getResumeWorkspace(input.sourceResumeId),
  ]);
  if (!resume || !workspace?.content || !workspace.versionStore) {
    return {
      ok: false,
      configured: true,
      error: "无法读取母版，请返回编辑器重试",
    };
  }

  try {
    const tailored = buildTailoredWorkspace({
      sourceTitle: resume.title,
      sourceContent: workspace.content,
      sourceStore: workspace.versionStore,
      expectedFingerprint: input.plan.sourceFingerprint,
      plan: input.plan,
      selected: input.selected,
      outputTitle: input.outputTitle,
    });
    const id = await createResumeWorkspace(
      tailored.title,
      tailored.content,
      tailored.versionStore
    );
    if (!id) {
      return {
        ok: false,
        configured: true,
        error: "创建定制简历失败，请稍后重试",
      };
    }
    return { ok: true, configured: true, id };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      error: error instanceof Error ? error.message : "创建定制简历失败",
    };
  }
}
