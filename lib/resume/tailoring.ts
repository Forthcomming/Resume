import type { ResumeContent } from "@/lib/resume/content";
import {
  addSectionSubVersion,
  sanitizeSectionSubVersionsStore,
  setActiveSectionVersion,
  updateActiveSectionContent,
  type SectionId,
  type SectionSubVersionsStore,
} from "@/lib/resume/versions";
import type { JdRecommendationAction } from "@/types/jd-tailoring";

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
    .join(",")}}`;
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createWorkspaceFingerprint(
  title: string,
  content: ResumeContent,
  store: SectionSubVersionsStore
): string {
  return fnv1a(stableSerialize({ title, content, store }));
}

export function defaultTailoredResumeTitle(
  companyName: string,
  jobTitle: string
): string {
  const company = companyName.trim();
  const job = jobTitle.trim();
  return company ? `${company}·${job}` : `${job}·定制版`;
}

type RewriteAction = Extract<
  JdRecommendationAction,
  { type: "rewrite_bullet" }
>;

function getBullet(
  content: ResumeContent["work" | "project" | "education"],
  action: RewriteAction
): string | null {
  const entry = content.entries[action.entryIndex];
  if (!entry) return null;
  const bullets = "bullets" in entry ? entry.bullets : entry.notes;
  return bullets[action.bulletIndex] ?? null;
}

function replaceBullet(
  content: ResumeContent["work" | "project" | "education"],
  action: RewriteAction
): ResumeContent["work" | "project" | "education"] {
  const clone = JSON.parse(JSON.stringify(content)) as typeof content;
  const entry = clone.entries[action.entryIndex];
  const bullets = "bullets" in entry ? entry.bullets : entry.notes;
  bullets[action.bulletIndex] = action.suggested.trim();
  return clone;
}

export function applyTailoringActions(
  sourceStore: SectionSubVersionsStore,
  actions: JdRecommendationAction[],
  versionName: string
): SectionSubVersionsStore {
  const store = sanitizeSectionSubVersionsStore(sourceStore);
  const switchBySection = new Map<SectionId, string>();
  const rewritesBySection = new Map<
    "work" | "project" | "education",
    RewriteAction[]
  >();

  for (const action of actions) {
    if (action.type === "keep") continue;
    if (action.type === "switch_version") {
      const existing = switchBySection.get(action.sectionId);
      if (existing && existing !== action.toVersionId) {
        throw new Error("同一板块存在冲突版本");
      }
      if (
        !store.sections[action.sectionId].versions.some(
          (version) => version.id === action.toVersionId
        )
      ) {
        throw new Error("推荐版本不存在");
      }
      switchBySection.set(action.sectionId, action.toVersionId);
      continue;
    }

    const source = store.sections[action.sectionId].versions.find(
      (version) => version.id === action.versionId
    );
    if (!source) throw new Error("推荐版本不存在");
    const current = getBullet(source.content, action);
    if (current === null) throw new Error("Bullet 索引无效");
    if (current !== action.original) throw new Error("原始 Bullet 已变化");
    const grouped = rewritesBySection.get(action.sectionId) ?? [];
    if (
      grouped.length > 0 &&
      grouped.some((item) => item.versionId !== action.versionId)
    ) {
      throw new Error("同一板块存在冲突版本");
    }
    grouped.push(action);
    rewritesBySection.set(action.sectionId, grouped);
  }

  let result = store;
  for (const [sectionId, versionId] of Array.from(switchBySection.entries())) {
    result = setActiveSectionVersion(result, sectionId, versionId);
  }

  for (const [sectionId, rewrites] of Array.from(
    rewritesBySection.entries()
  )) {
    const source = result.sections[sectionId].versions.find(
      (version) => version.id === rewrites[0].versionId
    );
    if (!source) throw new Error("推荐版本不存在");

    let nextContent = source.content;
    for (const rewrite of rewrites) {
      nextContent = replaceBullet(nextContent, rewrite) as typeof nextContent;
    }
    result = addSectionSubVersion(result, sectionId, versionName, {
      content: nextContent,
      createdBy: "ai",
      activate: true,
    });
    result = updateActiveSectionContent(result, sectionId, nextContent);
  }

  return result;
}
