"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { isCloudSyncEnabled } from "@/lib/storage/mode";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  readLocalResumeContent,
  readLocalResumeIndex,
} from "@/lib/resume/local-storage";
import { emptyResumeContent } from "@/lib/resume/content";

const DEFAULT_SECTION_ORDER = [
  "basic_info",
  "summary",
  "work",
  "education",
  "project",
  "skills",
];

/**
 * Ensure a Supabase anonymous session exists (one-tap / silent).
 * Returns the user id, or null when Auth is unavailable.
 */
export async function ensureAnonymousSession(): Promise<string | null> {
  if (!isCloudSyncEnabled() || !isSupabaseConfigured) return null;

  const supabase = createBrowserSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    console.error("[auth] anonymous sign-in failed", error?.message);
    return null;
  }
  return data.user.id;
}

/**
 * Upload localStorage resumes into the signed-in user's cloud library (RLS).
 * Idempotent upsert by id — safe to call on every enter.
 */
export async function migrateLocalResumesToCloud(): Promise<void> {
  if (!isCloudSyncEnabled() || !isSupabaseConfigured) return;

  const supabase = createBrowserSupabaseClient();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const entries = readLocalResumeIndex();
  for (const entry of entries) {
    const content =
      readLocalResumeContent(entry.id) ?? emptyResumeContent();

    const { data: existing } = await supabase
      .from("resumes")
      .select("id")
      .eq("id", entry.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("resumes")
        .update({
          title: entry.title,
          tags: entry.tags,
          content,
          updated_at: entry.updatedAt || new Date().toISOString(),
        })
        .eq("id", entry.id);
      continue;
    }

    await supabase.from("resumes").insert({
      id: entry.id,
      user_id: user.id,
      title: entry.title,
      tags: entry.tags,
      section_order: DEFAULT_SECTION_ORDER,
      content,
      created_at: entry.createdAt || new Date().toISOString(),
      updated_at: entry.updatedAt || new Date().toISOString(),
    });
  }
}

/** Sign in anonymously (if needed) then push any local resumes to cloud. */
export async function bootstrapCloudSession(): Promise<string | null> {
  const userId = await ensureAnonymousSession();
  if (userId) {
    try {
      await migrateLocalResumesToCloud();
    } catch (err) {
      console.error("[auth] local → cloud migrate failed", err);
    }
  }
  return userId;
}
