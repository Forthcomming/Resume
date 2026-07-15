import type { Resume } from "@/types/resume";
import type { ResumeContent } from "@/lib/resume/content";
import { LOCAL_GUEST_USER_ID } from "@/lib/auth/constants";
import { removeSectionSubVersionsStore } from "@/lib/resume/versions";

export const RESUME_INDEX_KEY = "resume-index";
export const RESUME_INDEX_CHANGED = "resume-index-changed";

export function resumeContentKey(id: string): string {
  return `resume-content:${id}`;
}

/** Metadata stored in localStorage for dashboard listing. */
export interface LocalResumeEntry {
  id: string;
  title: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function parseIndex(raw: string | null): LocalResumeEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (e): e is LocalResumeEntry =>
        e &&
        typeof e.id === "string" &&
        typeof e.title === "string"
    );
  } catch {
    return [];
  }
}

export function readLocalResumeIndex(): LocalResumeEntry[] {
  if (typeof window === "undefined") return [];
  return parseIndex(localStorage.getItem(RESUME_INDEX_KEY));
}

function writeIndex(entries: LocalResumeEntry[]): void {
  localStorage.setItem(RESUME_INDEX_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event(RESUME_INDEX_CHANGED));
}

/** Insert or update a resume in the local index. */
export function upsertLocalResume(
  entry: Pick<LocalResumeEntry, "id" | "title"> &
    Partial<Pick<LocalResumeEntry, "tags" | "createdAt" | "updatedAt">>
): LocalResumeEntry {
  const entries = readLocalResumeIndex();
  const ts = nowIso();
  const existing = entries.find((e) => e.id === entry.id);

  const next: LocalResumeEntry = {
    id: entry.id,
    title: entry.title,
    tags: entry.tags ?? existing?.tags ?? [],
    createdAt: entry.createdAt ?? existing?.createdAt ?? ts,
    updatedAt: entry.updatedAt ?? ts,
  };

  const updated = existing
    ? entries.map((e) => (e.id === entry.id ? next : e))
    : [next, ...entries];

  writeIndex(updated);
  return next;
}

/** Bump updatedAt for an existing local resume (e.g. after autosave). */
export function touchLocalResumeUpdated(id: string): void {
  const entries = readLocalResumeIndex();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return;

  entries[idx] = { ...entries[idx], updatedAt: nowIso() };
  writeIndex(entries);
}

export function saveLocalResumeContent(
  id: string,
  content: ResumeContent
): void {
  localStorage.setItem(resumeContentKey(id), JSON.stringify(content));
}

export function readLocalResumeContent(
  id: string
): ResumeContent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(resumeContentKey(id));
    return raw ? (JSON.parse(raw) as ResumeContent) : null;
  } catch {
    return null;
  }
}

export function removeLocalResume(id: string): void {
  const entries = readLocalResumeIndex().filter((e) => e.id !== id);
  writeIndex(entries);
  localStorage.removeItem(resumeContentKey(id));
  removeSectionSubVersionsStore(id);
}

export function localEntryToResume(entry: LocalResumeEntry): Resume {
  return {
    id: entry.id,
    userId: LOCAL_GUEST_USER_ID,
    title: entry.title,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    sectionOrder: [],
    tags: entry.tags,
  };
}

/**
 * Merge server-side resumes with local-only entries.
 * Server wins when the same id exists in both.
 */
export function mergeResumeLists(
  server: Resume[],
  local: LocalResumeEntry[]
): { resumes: Resume[]; localOnlyIds: Set<string> } {
  const serverIds = new Set(server.map((r) => r.id));
  const localOnlyIds = new Set<string>();

  const merged = [...server];
  for (const entry of local) {
    if (serverIds.has(entry.id)) continue;
    localOnlyIds.add(entry.id);
    merged.push(localEntryToResume(entry));
  }

  merged.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return { resumes: merged, localOnlyIds };
}
