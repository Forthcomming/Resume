import type { ResumeContent } from "@/lib/resume/content";
import {
  addEntryVersion,
  addSectionSubVersion,
  sanitizeSectionSubVersionsStore,
  setActiveEntryVersion,
  setActiveSectionVersion,
  setEntryEnabled,
  updateActiveEntryVersionContent,
  updateActiveSectionContent,
  type EntrySectionId,
  type ProjectEntryVariant,
  type SectionSubVersionsStore,
  type WorkEntryVariant,
} from "@/lib/resume/versions";
import type { JdRecommendationAction } from "@/types/jd-tailoring";

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(",")}}`;
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 0x01000193); }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createWorkspaceFingerprint(title: string, content: ResumeContent, store: SectionSubVersionsStore): string {
  return fnv1a(stableSerialize({ title, content, store }));
}

export function defaultTailoredResumeTitle(companyName: string, jobTitle: string): string {
  const company = companyName.trim(); const job = jobTitle.trim();
  return company ? `${company}·${job}` : `${job}·定制版`;
}

type EntryRewrite = Extract<JdRecommendationAction, { type: "rewrite_entry_bullet" }>;
type EducationRewrite = Extract<JdRecommendationAction, { type: "rewrite_education_bullet" }>;

export function applyTailoringActions(sourceStore: SectionSubVersionsStore, actions: JdRecommendationAction[], versionName: string): SectionSubVersionsStore {
  let result = sanitizeSectionSubVersionsStore(sourceStore);
  const finalEnabled = new Map<string, boolean>();
  for (const action of actions) if (action.type === "set_entry_enabled") finalEnabled.set(`${action.sectionId}:${action.entryId}`, action.enabled);

  for (const action of actions) {
    if (action.type !== "set_entry_enabled") continue;
    result = setEntryEnabled(result, action.sectionId, action.entryId, action.enabled);
  }
  for (const action of actions) {
    if (action.type === "switch_entry_version") {
      if (finalEnabled.get(`${action.sectionId}:${action.entryId}`) === false) continue;
      const entry = result.entrySections[action.sectionId].entries[action.entryId];
      if (!entry?.versions.some((version) => version.id === action.toVersionId)) throw new Error("推荐经历版本不存在");
      result = setActiveEntryVersion(result, action.sectionId, action.entryId, action.toVersionId);
    }
    if (action.type === "switch_section_version") result = setActiveSectionVersion(result, action.sectionId, action.toVersionId);
  }

  const rewrites = new Map<string, EntryRewrite[]>();
  const education: EducationRewrite[] = [];
  for (const action of actions) {
    if (action.type === "rewrite_entry_bullet") {
      if (finalEnabled.get(`${action.sectionId}:${action.entryId}`) === false) continue;
      const key = `${action.sectionId}:${action.entryId}:${action.versionId}`;
      rewrites.set(key, [...(rewrites.get(key) ?? []), action]);
    } else if (action.type === "rewrite_education_bullet") education.push(action);
  }
  for (const group of Array.from(rewrites.values())) {
    const first = group[0]; const entry = result.entrySections[first.sectionId].entries[first.entryId];
    const source = entry?.versions.find((version) => version.id === first.versionId);
    if (!entry || !source) throw new Error("推荐经历版本不存在");
    const next = JSON.parse(JSON.stringify(source.content)) as WorkEntryVariant | ProjectEntryVariant;
    for (const action of group) {
      if (next.bullets[action.bulletIndex] !== action.original) throw new Error("原始 Bullet 已变化");
      next.bullets[action.bulletIndex] = action.suggested.trim();
    }
    result = setActiveEntryVersion(result, first.sectionId, first.entryId, first.versionId);
    result = addEntryVersion(result, first.sectionId, first.entryId, versionName, { content: next, createdBy: "ai" });
    result = updateActiveEntryVersionContent(result, first.sectionId, first.entryId, next);
  }
  if (education.length) {
    const bucket = result.sections.education;
    const source = bucket.versions.find((version) => version.id === education[0].versionId);
    if (!source) throw new Error("推荐教育版本不存在");
    const content = JSON.parse(JSON.stringify(source.content)) as ResumeContent["education"];
    for (const action of education) {
      if (content.entries[action.entryIndex]?.notes[action.bulletIndex] !== action.original) throw new Error("原始 Bullet 已变化");
      content.entries[action.entryIndex].notes[action.bulletIndex] = action.suggested.trim();
    }
    result = addSectionSubVersion(result, "education", versionName, { content, createdBy: "ai", activate: true });
    result = updateActiveSectionContent(result, "education", content);
  }
  return result;
}
