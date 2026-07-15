import {
  emptyResumeContent,
  normalizeResumeContent,
  normalizeSectionContent,
  type ResumeContent,
} from "@/lib/resume/content";
import {
  DEFAULT_DATE_DISPLAY_FORMAT,
  isDateDisplayFormat,
  type DateDisplayFormat,
} from "@/lib/resume/date-display";

export type SectionId = keyof ResumeContent;

export type SectionCreatedBy = "user" | "ai";

/** One named sub-version within a single section (e.g. ToB / ToC for projects). */
export interface SectionSubVersion<T = unknown> {
  id: string;
  name: string;
  content: T;
  createdAt: string;
  createdBy: SectionCreatedBy;
}

export interface SectionBucket<T = unknown> {
  activeVersionId: string;
  versions: SectionSubVersion<T>[];
}

export interface SectionSubVersionsStore {
  schemaVersion: 1;
  /** Display order of sections in editor + preview body (basic_info always first). */
  sectionOrder: SectionId[];
  /** Custom display labels per section (editor + PDF preview). */
  sectionTitles: Partial<Record<SectionId, string>>;
  /** Shared date format for preview (education / work / project). */
  dateDisplayFormat?: DateDisplayFormat;
  sections: {
    [K in SectionId]: SectionBucket<ResumeContent[K]>;
  };
}

/** @deprecated Old global snapshot model — kept only for migration. */
interface LegacyResumeVersion {
  id: string;
  name: string;
  content: ResumeContent;
  createdAt: string;
}

interface LegacyVersionStore {
  versions: LegacyResumeVersion[];
  compose: Record<SectionId, string>;
}

export const SECTION_IDS: SectionId[] = [
  "basic_info",
  "summary",
  "work",
  "education",
  "project",
  "skills",
];

export const DEFAULT_SECTION_LABELS: Record<SectionId, string> = {
  basic_info: "基本信息",
  summary: "个人简介",
  work: "工作经历",
  education: "教育经历",
  project: "项目经历",
  skills: "技能",
};

function sanitizeSectionTitles(
  raw: Partial<Record<SectionId, string>> | undefined
): Partial<Record<SectionId, string>> {
  const result: Partial<Record<SectionId, string>> = {};
  if (!raw || typeof raw !== "object") return result;
  for (const id of SECTION_IDS) {
    const label = raw[id]?.trim();
    if (label && label !== DEFAULT_SECTION_LABELS[id]) {
      result[id] = label;
    }
  }
  return result;
}

export function getDateDisplayFormat(
  store: SectionSubVersionsStore
): DateDisplayFormat {
  return isDateDisplayFormat(store.dateDisplayFormat)
    ? store.dateDisplayFormat
    : DEFAULT_DATE_DISPLAY_FORMAT;
}

export function setDateDisplayFormat(
  store: SectionSubVersionsStore,
  format: DateDisplayFormat
): SectionSubVersionsStore {
  return { ...store, dateDisplayFormat: format };
}

export function getSectionDisplayTitle(
  store: SectionSubVersionsStore,
  sectionId: SectionId
): string {
  return (
    store.sectionTitles[sectionId]?.trim() || DEFAULT_SECTION_LABELS[sectionId]
  );
}

export function setSectionDisplayTitle(
  store: SectionSubVersionsStore,
  sectionId: SectionId,
  title: string
): SectionSubVersionsStore {
  const trimmed = title.trim();
  const next = { ...store.sectionTitles };
  if (!trimmed || trimmed === DEFAULT_SECTION_LABELS[sectionId]) {
    delete next[sectionId];
  } else {
    next[sectionId] = trimmed;
  }
  return { ...store, sectionTitles: next };
}

export function sectionSubVersionsKey(resumeId: string): string {
  return `resume-section-subversions:${resumeId}`;
}

/** Legacy key used by the previous global-version composer. */
export function resumeVersionsKey(resumeId: string): string {
  return `resume-versions:${resumeId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createSubVersion<T>(
  name: string,
  content: T,
  createdBy: SectionCreatedBy = "user",
  id = newId()
): SectionSubVersion<T> {
  return {
    id,
    name,
    content: jsonClone(content),
    createdAt: nowIso(),
    createdBy,
  };
}

function emptyBucket<K extends SectionId>(
  sectionId: K,
  content?: ResumeContent[K]
): SectionBucket<ResumeContent[K]> {
  const version = createSubVersion(
    "默认",
    content ?? emptyResumeContent()[sectionId],
    "user"
  );
  return {
    activeVersionId: version.id,
    versions: [version],
  };
}

export type BodySectionId = Exclude<SectionId, "basic_info">;

/** Body sections that can be reordered (basic_info stays as resume header). */
export const REORDERABLE_SECTION_IDS: BodySectionId[] = [
  "summary",
  "work",
  "education",
  "project",
  "skills",
];

export function defaultSectionOrder(): SectionId[] {
  return [...SECTION_IDS];
}

/** Ensure basic_info is first and every section id appears exactly once. */
export function sanitizeSectionOrder(order?: SectionId[]): SectionId[] {
  const seen = new Set<BodySectionId>();
  const body: BodySectionId[] = [];

  for (const id of order ?? []) {
    if (id === "basic_info") continue;
    if (
      (REORDERABLE_SECTION_IDS as readonly string[]).includes(id) &&
      !seen.has(id as BodySectionId)
    ) {
      seen.add(id as BodySectionId);
      body.push(id as BodySectionId);
    }
  }

  for (const id of REORDERABLE_SECTION_IDS) {
    if (!seen.has(id)) body.push(id);
  }

  return ["basic_info", ...body];
}

export function getSectionOrder(store: SectionSubVersionsStore): SectionId[] {
  return sanitizeSectionOrder(store.sectionOrder);
}

/** Reorder sections by index within the full sectionOrder array. */
export function reorderSections(
  store: SectionSubVersionsStore,
  fromIndex: number,
  toIndex: number
): SectionSubVersionsStore {
  const order = getSectionOrder(store);
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= order.length ||
    toIndex >= order.length
  ) {
    return store;
  }

  // Keep basic_info pinned at the top.
  if (order[fromIndex] === "basic_info" || order[toIndex] === "basic_info") {
    return store;
  }

  const next = [...order];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return { ...store, sectionOrder: sanitizeSectionOrder(next) };
}

/** Build store from a flat resume content blob (one default sub-version per section). */
export function initSectionSubVersionsStore(
  content: ResumeContent
): SectionSubVersionsStore {
  const normalized = normalizeResumeContent(content);
  return {
    schemaVersion: 1,
    sectionOrder: defaultSectionOrder(),
    sectionTitles: {},
    dateDisplayFormat: DEFAULT_DATE_DISPLAY_FORMAT,
    sections: {
      basic_info: emptyBucket("basic_info", normalized.basic_info),
      summary: emptyBucket("summary", normalized.summary),
      work: emptyBucket("work", normalized.work),
      education: emptyBucket("education", normalized.education),
      project: emptyBucket("project", normalized.project),
      skills: emptyBucket("skills", normalized.skills),
    },
  };
}

function isSectionSubVersionsStore(
  value: unknown
): value is SectionSubVersionsStore {
  if (!value || typeof value !== "object") return false;
  const v = value as SectionSubVersionsStore;
  return v.schemaVersion === 1 && !!v.sections?.basic_info?.versions;
}

function isLegacyVersionStore(value: unknown): value is LegacyVersionStore {
  if (!value || typeof value !== "object") return false;
  const v = value as LegacyVersionStore;
  return Array.isArray(v.versions) && v.versions.length > 0 && !!v.compose;
}

function migrateSectionBucket<K extends SectionId>(
  sectionId: K,
  legacy: LegacyVersionStore
): SectionBucket<ResumeContent[K]> {
  const versions: SectionSubVersion<ResumeContent[K]>[] = [];
  const seenNames = new Set<string>();

  for (const global of legacy.versions) {
    const name = global.name?.trim() || "默认";
    if (seenNames.has(name)) continue;
    seenNames.add(name);
    const sectionContent = normalizeResumeContent(global.content)[sectionId];
    versions.push(createSubVersion(name, sectionContent, "user", newId()));
  }

  if (versions.length === 0) return emptyBucket(sectionId);

  const activeGlobalId = legacy.compose?.[sectionId];
  const activeGlobal = legacy.versions.find((v) => v.id === activeGlobalId);
  const activeName = activeGlobal?.name?.trim() || versions[0].name;
  const active = versions.find((v) => v.name === activeName) ?? versions[0];

  return {
    activeVersionId: active.id,
    versions,
  };
}

/** Migrate old global snapshot store into per-section sub-versions. */
export function migrateLegacyVersionStore(
  legacy: LegacyVersionStore
): SectionSubVersionsStore {
  return {
    schemaVersion: 1,
    sectionOrder: defaultSectionOrder(),
    sectionTitles: {},
    dateDisplayFormat: DEFAULT_DATE_DISPLAY_FORMAT,
    sections: {
      basic_info: migrateSectionBucket("basic_info", legacy),
      summary: migrateSectionBucket("summary", legacy),
      work: migrateSectionBucket("work", legacy),
      education: migrateSectionBucket("education", legacy),
      project: migrateSectionBucket("project", legacy),
      skills: migrateSectionBucket("skills", legacy),
    },
  };
}

function sanitizeSectionBucket<K extends SectionId>(
  sectionId: K,
  bucket: SectionBucket<ResumeContent[K]> | undefined
): SectionBucket<ResumeContent[K]> {
  const versions = (bucket?.versions ?? []).map((v) => ({
    ...v,
    name: v.name?.trim() || "默认",
    createdBy: (v.createdBy === "ai" ? "ai" : "user") as SectionCreatedBy,
    content: normalizeSectionContent(
      sectionId,
      jsonClone(v.content ?? emptyResumeContent()[sectionId])
    ),
  }));

  if (versions.length === 0) return emptyBucket(sectionId);

  const activeId =
    versions.find((v) => v.id === bucket?.activeVersionId)?.id ??
    versions[0].id;

  return {
    activeVersionId: activeId,
    versions,
  };
}

export function sanitizeSectionSubVersionsStore(
  store: SectionSubVersionsStore
): SectionSubVersionsStore {
  return {
    schemaVersion: 1,
    sectionOrder: sanitizeSectionOrder(store.sectionOrder),
    sectionTitles: sanitizeSectionTitles(store.sectionTitles),
    dateDisplayFormat: getDateDisplayFormat(store),
    sections: {
      basic_info: sanitizeSectionBucket("basic_info", store.sections?.basic_info),
      summary: sanitizeSectionBucket("summary", store.sections?.summary),
      work: sanitizeSectionBucket("work", store.sections?.work),
      education: sanitizeSectionBucket("education", store.sections?.education),
      project: sanitizeSectionBucket("project", store.sections?.project),
      skills: sanitizeSectionBucket("skills", store.sections?.skills),
    },
  };
}

export function readSectionSubVersionsStore(
  resumeId: string
): SectionSubVersionsStore | null {
  if (typeof window === "undefined") return null;

  try {
    const nextRaw = localStorage.getItem(sectionSubVersionsKey(resumeId));
    if (nextRaw) {
      const parsed = JSON.parse(nextRaw);
      if (isSectionSubVersionsStore(parsed)) {
        return sanitizeSectionSubVersionsStore(parsed);
      }
    }
  } catch {
    /* fall through to legacy */
  }

  try {
    const legacyRaw = localStorage.getItem(resumeVersionsKey(resumeId));
    if (!legacyRaw) return null;
    const legacy = JSON.parse(legacyRaw);
    if (!isLegacyVersionStore(legacy)) return null;
    const migrated = migrateLegacyVersionStore(legacy);
    const sanitized = sanitizeSectionSubVersionsStore(migrated);
    saveSectionSubVersionsStore(resumeId, sanitized);
    return sanitized;
  } catch {
    return null;
  }
}

export function saveSectionSubVersionsStore(
  resumeId: string,
  store: SectionSubVersionsStore
): void {
  localStorage.setItem(
    sectionSubVersionsKey(resumeId),
    JSON.stringify(store)
  );
}

export function removeSectionSubVersionsStore(resumeId: string): void {
  localStorage.removeItem(sectionSubVersionsKey(resumeId));
  localStorage.removeItem(resumeVersionsKey(resumeId));
}

/** Merge active sub-versions into one ResumeContent for preview/export/autosave. */
export function composeFromSectionSubVersions(
  store: SectionSubVersionsStore
): ResumeContent {
  const pick = <K extends SectionId>(id: K): ResumeContent[K] => {
    const bucket = store.sections[id];
    const active =
      bucket.versions.find((v) => v.id === bucket.activeVersionId) ??
      bucket.versions[0];
    if (active) return jsonClone(active.content);
    return emptyResumeContent()[id];
  };

  return normalizeResumeContent({
    basic_info: pick("basic_info"),
    summary: pick("summary"),
    work: pick("work"),
    education: pick("education"),
    project: pick("project"),
    skills: pick("skills"),
  });
}

export function getActiveSectionContent<K extends SectionId>(
  store: SectionSubVersionsStore,
  sectionId: K
): ResumeContent[K] {
  const bucket = store.sections[sectionId];
  const active =
    bucket.versions.find((v) => v.id === bucket.activeVersionId) ??
    bucket.versions[0];
  return active
    ? normalizeSectionContent(sectionId, jsonClone(active.content))
    : emptyResumeContent()[sectionId];
}

export function getSectionVersions(
  store: SectionSubVersionsStore,
  sectionId: SectionId
): SectionSubVersion[] {
  return store.sections[sectionId].versions;
}

export function getActiveSectionVersionId(
  store: SectionSubVersionsStore,
  sectionId: SectionId
): string {
  return store.sections[sectionId].activeVersionId;
}

export function setActiveSectionVersion(
  store: SectionSubVersionsStore,
  sectionId: SectionId,
  versionId: string
): SectionSubVersionsStore {
  const bucket = store.sections[sectionId];
  if (!bucket.versions.some((v) => v.id === versionId)) return store;
  return {
    ...store,
    sections: {
      ...store.sections,
      [sectionId]: { ...bucket, activeVersionId: versionId },
    },
  };
}

export function updateActiveSectionContent(
  store: SectionSubVersionsStore,
  sectionId: SectionId,
  sectionContent: ResumeContent[SectionId]
): SectionSubVersionsStore {
  const bucket = store.sections[sectionId];
  return {
    ...store,
    sections: {
      ...store.sections,
      [sectionId]: {
        ...bucket,
        versions: bucket.versions.map((v) =>
          v.id === bucket.activeVersionId
            ? { ...v, content: jsonClone(sectionContent) }
            : v
        ),
      },
    },
  };
}

/** Create a new sub-version for a section from current active content (or provided content). */
export function addSectionSubVersion(
  store: SectionSubVersionsStore,
  sectionId: SectionId,
  name: string,
  options?: {
    content?: ResumeContent[SectionId];
    createdBy?: SectionCreatedBy;
    activate?: boolean;
  }
): SectionSubVersionsStore {
  const bucket = store.sections[sectionId];
  const active =
    bucket.versions.find((v) => v.id === bucket.activeVersionId) ??
    bucket.versions[0];
  const content =
    options?.content ?? active?.content ?? emptyResumeContent()[sectionId];
  const version = createSubVersion(
    name.trim() || "新版本",
    content,
    options?.createdBy ?? "user"
  );
  const activate = options?.activate !== false;

  return {
    ...store,
    sections: {
      ...store.sections,
      [sectionId]: {
        activeVersionId: activate ? version.id : bucket.activeVersionId,
        versions: [...bucket.versions, version],
      },
    },
  };
}

export function renameSectionSubVersion(
  store: SectionSubVersionsStore,
  sectionId: SectionId,
  versionId: string,
  name: string
): SectionSubVersionsStore {
  const bucket = store.sections[sectionId];
  const trimmed = name.trim();
  if (!trimmed) return store;
  return {
    ...store,
    sections: {
      ...store.sections,
      [sectionId]: {
        ...bucket,
        versions: bucket.versions.map((v) =>
          v.id === versionId ? { ...v, name: trimmed } : v
        ),
      },
    },
  };
}

export function duplicateSectionSubVersion(
  store: SectionSubVersionsStore,
  sectionId: SectionId,
  versionId: string,
  name?: string
): SectionSubVersionsStore {
  const bucket = store.sections[sectionId];
  const source = bucket.versions.find((v) => v.id === versionId);
  if (!source) return store;
  const copy = createSubVersion(
    name ?? `${source.name} 副本`,
    source.content,
    "user"
  );
  return {
    ...store,
    sections: {
      ...store.sections,
      [sectionId]: {
        activeVersionId: copy.id,
        versions: [...bucket.versions, copy],
      },
    },
  };
}

/** Remove a sub-version. At least one version must remain per section. */
export function deleteSectionSubVersion(
  store: SectionSubVersionsStore,
  sectionId: SectionId,
  versionId: string
): SectionSubVersionsStore {
  const bucket = store.sections[sectionId];
  if (bucket.versions.length <= 1) return store;

  const nextVersions = bucket.versions.filter((v) => v.id !== versionId);
  if (nextVersions.length === bucket.versions.length) return store;

  const nextActiveId =
    bucket.activeVersionId === versionId
      ? nextVersions[0].id
      : bucket.activeVersionId;

  return {
    ...store,
    sections: {
      ...store.sections,
      [sectionId]: {
        activeVersionId: nextActiveId,
        versions: nextVersions,
      },
    },
  };
}

export function formatVersionDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Total sub-version count across all sections (for summary UI). */
export function countAllSubVersions(store: SectionSubVersionsStore): number {
  return SECTION_IDS.reduce(
    (sum, id) => sum + store.sections[id].versions.length,
    0
  );
}
