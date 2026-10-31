import {
  emptyResumeContent,
  emptyProjectEntry,
  emptyWorkEntry,
  normalizeResumeContent,
  normalizeSectionContent,
  type ProjectEntry,
  type ResumeContent,
  type WorkEntry,
} from "@/lib/resume/content";
import {
  DEFAULT_DATE_DISPLAY_FORMAT,
  isDateDisplayFormat,
  type DateDisplayFormat,
} from "@/lib/resume/date-display";
import { reorderList } from "@/lib/resume/reorder";

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

export type EntrySectionId = "work" | "project";
export type StandardSectionId = Exclude<SectionId, EntrySectionId>;
export type WorkEntryFacts = Pick<
  WorkEntry,
  "company" | "location" | "startDate" | "endDate"
>;
export type WorkEntryVariant = Pick<WorkEntry, "title" | "summary" | "bullets">;
export type ProjectEntryFacts = Pick<
  ProjectEntry,
  "name" | "startDate" | "endDate" | "link"
>;
export type ProjectEntryVariant = Pick<
  ProjectEntry,
  "role" | "techStack" | "summary" | "bullets"
>;

export type EntryVersion<T> = SectionSubVersion<T>;

export interface EntryModule<TFacts, TVariant> {
  id: string;
  enabled: boolean;
  facts: TFacts;
  activeVersionId: string;
  versions: EntryVersion<TVariant>[];
}

export interface EntrySectionStore<TFacts, TVariant> {
  order: string[];
  entries: Record<string, EntryModule<TFacts, TVariant>>;
}

export interface SectionSubVersionsStore {
  schemaVersion: 2;
  /** Display order of sections in editor + preview (all sections, including basic_info). */
  sectionOrder: SectionId[];
  /** Custom display labels per section (editor + PDF preview). */
  sectionTitles: Partial<Record<SectionId, string>>;
  /** Shared date format for preview (education / work / project). */
  dateDisplayFormat?: DateDisplayFormat;
  /** @deprecated Ignored — single campus preview style. Kept for old payloads. */
  density?: unknown;
  sections: {
    [K in SectionId]: SectionBucket<ResumeContent[K]>;
  };
  entrySections: {
    work: EntrySectionStore<WorkEntryFacts, WorkEntryVariant>;
    project: EntrySectionStore<ProjectEntryFacts, ProjectEntryVariant>;
  };
}

interface LegacySectionSubVersionsStore {
  schemaVersion: 1;
  sectionOrder: SectionId[];
  sectionTitles: Partial<Record<SectionId, string>>;
  dateDisplayFormat?: DateDisplayFormat;
  density?: unknown;
  sections: { [K in SectionId]: SectionBucket<ResumeContent[K]> };
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

function stableId(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `entry-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function splitWorkEntry(entry: WorkEntry): {
  facts: WorkEntryFacts;
  variant: WorkEntryVariant;
} {
  return {
    facts: {
      company: entry.company,
      location: entry.location,
      startDate: entry.startDate,
      endDate: entry.endDate,
    },
    variant: {
      title: entry.title,
      summary: entry.summary ?? "",
      bullets: [...entry.bullets],
    },
  };
}

function splitProjectEntry(entry: ProjectEntry): {
  facts: ProjectEntryFacts;
  variant: ProjectEntryVariant;
} {
  return {
    facts: {
      name: entry.name,
      startDate: entry.startDate,
      endDate: entry.endDate,
      link: entry.link,
    },
    variant: {
      role: entry.role,
      techStack: [...entry.techStack],
      summary: entry.summary ?? "",
      bullets: [...entry.bullets],
    },
  };
}

function identityPart(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function entryIdentity(sectionId: EntrySectionId, entry: WorkEntry | ProjectEntry): string {
  return sectionId === "work"
    ? [
        identityPart((entry as WorkEntry).company),
        entry.startDate,
        entry.endDate,
      ].join("|")
    : [
        identityPart((entry as ProjectEntry).name),
        entry.startDate,
        entry.endDate,
      ].join("|");
}

function variantSignature(value: unknown): string {
  return JSON.stringify(value);
}

function uniqueVersionName<T>(versions: EntryVersion<T>[], requested: string): string {
  const base = requested.trim() || "默认";
  if (!versions.some((version) => version.name === base)) return base;
  let suffix = 2;
  while (versions.some((version) => version.name === `${base} ${suffix}`)) suffix += 1;
  return `${base} ${suffix}`;
}

function createEntrySectionFromFlat(
  sectionId: "work",
  entries: WorkEntry[]
): EntrySectionStore<WorkEntryFacts, WorkEntryVariant>;
function createEntrySectionFromFlat(
  sectionId: "project",
  entries: ProjectEntry[]
): EntrySectionStore<ProjectEntryFacts, ProjectEntryVariant>;
function createEntrySectionFromFlat(
  sectionId: EntrySectionId,
  entries: Array<WorkEntry | ProjectEntry>
): EntrySectionStore<WorkEntryFacts | ProjectEntryFacts, WorkEntryVariant | ProjectEntryVariant> {
  const result: EntrySectionStore<
    WorkEntryFacts | ProjectEntryFacts,
    WorkEntryVariant | ProjectEntryVariant
  > = { order: [], entries: {} };
  const counts = new Map<string, number>();
  entries.forEach((entry) => {
    const identity = entryIdentity(sectionId, entry);
    const ordinal = (counts.get(identity) ?? 0) + 1;
    counts.set(identity, ordinal);
    const id = stableId(`${sectionId}|${identity}|${ordinal}`);
    const split = sectionId === "work"
      ? splitWorkEntry(entry as WorkEntry)
      : splitProjectEntry(entry as ProjectEntry);
    const version = createSubVersion("默认", split.variant, "user", `${id}-default`);
    result.order.push(id);
    result.entries[id] = {
      id,
      enabled: true,
      facts: split.facts,
      activeVersionId: version.id,
      versions: [version],
    };
  });
  return result;
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

/** Non-header body section ids (preview helpers). */
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

/** Every section id exactly once; preserve given order, append missing in default order. */
export function sanitizeSectionOrder(order?: SectionId[]): SectionId[] {
  const allowed = new Set<string>(SECTION_IDS);
  const seen = new Set<SectionId>();
  const next: SectionId[] = [];

  for (const id of order ?? []) {
    if (allowed.has(id) && !seen.has(id)) {
      seen.add(id);
      next.push(id);
    }
  }

  for (const id of SECTION_IDS) {
    if (!seen.has(id)) next.push(id);
  }

  return next;
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
  const next = reorderList(order, fromIndex, toIndex);
  if (next === order) return store;
  return { ...store, sectionOrder: sanitizeSectionOrder(next) };
}

/** Build store from a flat resume content blob (one default sub-version per section). */
export function initSectionSubVersionsStore(
  content: ResumeContent
): SectionSubVersionsStore {
  const normalized = normalizeResumeContent(content);
  return {
    schemaVersion: 2,
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
    entrySections: {
      work: createEntrySectionFromFlat("work", normalized.work.entries),
      project: createEntrySectionFromFlat("project", normalized.project.entries),
    },
  };
}

function isSectionSubVersionsStore(
  value: unknown
): value is SectionSubVersionsStore {
  if (!value || typeof value !== "object") return false;
  const v = value as SectionSubVersionsStore;
  return (
    v.schemaVersion === 2 &&
    !!v.sections?.basic_info?.versions &&
    !!v.entrySections?.work?.entries &&
    !!v.entrySections?.project?.entries
  );
}

function isLegacySectionSubVersionsStore(
  value: unknown
): value is LegacySectionSubVersionsStore {
  if (!value || typeof value !== "object") return false;
  const v = value as LegacySectionSubVersionsStore;
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
  const sectionStore: LegacySectionSubVersionsStore = {
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
  return migrateSectionStoreV1(sectionStore);
}

function migrateEntrySectionV1(
  sectionId: "work",
  bucket: SectionBucket<ResumeContent["work"]>
): EntrySectionStore<WorkEntryFacts, WorkEntryVariant>;
function migrateEntrySectionV1(
  sectionId: "project",
  bucket: SectionBucket<ResumeContent["project"]>
): EntrySectionStore<ProjectEntryFacts, ProjectEntryVariant>;
function migrateEntrySectionV1(
  sectionId: EntrySectionId,
  bucket: SectionBucket<ResumeContent[EntrySectionId]>
): EntrySectionStore<WorkEntryFacts | ProjectEntryFacts, WorkEntryVariant | ProjectEntryVariant> {
  const result: EntrySectionStore<
    WorkEntryFacts | ProjectEntryFacts,
    WorkEntryVariant | ProjectEntryVariant
  > = { order: [], entries: {} };
  const active = bucket.versions.find((version) => version.id === bucket.activeVersionId) ?? bucket.versions[0];
  const orderedVersions = active
    ? [active, ...bucket.versions.filter((version) => version.id !== active.id)]
    : bucket.versions;

  for (const sectionVersion of orderedVersions) {
    const counts = new Map<string, number>();
    for (const rawEntry of sectionVersion.content.entries) {
      const entry = rawEntry as WorkEntry | ProjectEntry;
      const identity = entryIdentity(sectionId, entry);
      const ordinal = (counts.get(identity) ?? 0) + 1;
      counts.set(identity, ordinal);
      const id = stableId(`${sectionId}|${identity}|${ordinal}`);
      const split = sectionId === "work"
        ? splitWorkEntry(entry as WorkEntry)
        : splitProjectEntry(entry as ProjectEntry);
      let entryModule = result.entries[id];
      if (!entryModule) {
        entryModule = {
          id,
          enabled: sectionVersion.id === active?.id,
          facts: split.facts,
          activeVersionId: "",
          versions: [],
        };
        result.entries[id] = entryModule;
        result.order.push(id);
      }
      const signature = variantSignature(split.variant);
      let entryVersion = entryModule.versions.find(
        (version) => variantSignature(version.content) === signature
      );
      if (!entryVersion) {
        entryVersion = createSubVersion(
          uniqueVersionName(entryModule.versions, sectionVersion.name),
          split.variant,
          sectionVersion.createdBy,
          `${id}-${sectionVersion.id}`
        );
        entryModule.versions.push(entryVersion);
      }
      if (sectionVersion.id === active?.id) {
        entryModule.enabled = true;
        entryModule.facts = split.facts;
        entryModule.activeVersionId = entryVersion.id;
      } else if (!entryModule.activeVersionId) {
        entryModule.activeVersionId = entryVersion.id;
      }
    }
  }
  return result;
}

export function migrateSectionStoreV1(
  store: LegacySectionSubVersionsStore
): SectionSubVersionsStore {
  return sanitizeSectionSubVersionsStore({
    schemaVersion: 2,
    sectionOrder: store.sectionOrder,
    sectionTitles: store.sectionTitles,
    dateDisplayFormat: store.dateDisplayFormat,
    sections: store.sections,
    entrySections: {
      work: migrateEntrySectionV1("work", store.sections.work),
      project: migrateEntrySectionV1("project", store.sections.project),
    },
  });
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

function sanitizeEntrySection(
  sectionId: "work",
  value: EntrySectionStore<WorkEntryFacts, WorkEntryVariant> | undefined
): EntrySectionStore<WorkEntryFacts, WorkEntryVariant>;
function sanitizeEntrySection(
  sectionId: "project",
  value: EntrySectionStore<ProjectEntryFacts, ProjectEntryVariant> | undefined
): EntrySectionStore<ProjectEntryFacts, ProjectEntryVariant>;
function sanitizeEntrySection(
  sectionId: EntrySectionId,
  value:
    | EntrySectionStore<WorkEntryFacts, WorkEntryVariant>
    | EntrySectionStore<ProjectEntryFacts, ProjectEntryVariant>
    | undefined
): EntrySectionStore<WorkEntryFacts | ProjectEntryFacts, WorkEntryVariant | ProjectEntryVariant> {
  const entries: Record<
    string,
    EntryModule<WorkEntryFacts | ProjectEntryFacts, WorkEntryVariant | ProjectEntryVariant>
  > = {};
  for (const [key, raw] of Object.entries(value?.entries ?? {})) {
    if (!raw || typeof raw !== "object") continue;
    const id = raw.id || key;
    const fallback = sectionId === "work" ? splitWorkEntry(emptyWorkEntry()) : splitProjectEntry(emptyProjectEntry());
    const versions: EntryVersion<WorkEntryVariant | ProjectEntryVariant>[] = (
      raw.versions ?? []
    ).map((version: EntryVersion<WorkEntryVariant | ProjectEntryVariant>) => ({
      ...version,
      id: version.id || newId(),
      name: version.name?.trim() || "默认",
      createdAt: version.createdAt || nowIso(),
      createdBy: version.createdBy === "ai" ? "ai" as const : "user" as const,
      content: jsonClone(version.content ?? fallback.variant),
    }));
    if (versions.length === 0) {
      versions.push(createSubVersion("默认", fallback.variant));
    }
    entries[id] = {
      id,
      enabled: raw.enabled !== false,
      facts: jsonClone(raw.facts ?? fallback.facts),
      activeVersionId: versions.some((version) => version.id === raw.activeVersionId)
        ? raw.activeVersionId
        : versions[0].id,
      versions,
    };
  }
  const order = (value?.order ?? []).filter((id, index, list) => entries[id] && list.indexOf(id) === index);
  for (const id of Object.keys(entries)) if (!order.includes(id)) order.push(id);
  return { order, entries };
}

export function sanitizeSectionSubVersionsStore(
  store: SectionSubVersionsStore
): SectionSubVersionsStore {
  return {
    schemaVersion: 2,
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
    entrySections: {
      work: sanitizeEntrySection("work", store.entrySections?.work),
      project: sanitizeEntrySection("project", store.entrySections?.project),
    },
  };
}

/** Parse and sanitize a raw version_store blob (DB / network). Returns null if invalid. */
export function parseSectionSubVersionsStore(
  raw: unknown
): SectionSubVersionsStore | null {
  if (isSectionSubVersionsStore(raw)) return sanitizeSectionSubVersionsStore(raw);
  if (isLegacySectionSubVersionsStore(raw)) return migrateSectionStoreV1(raw);
  return null;
}

export function readSectionSubVersionsStore(
  resumeId: string
): SectionSubVersionsStore | null {
  if (typeof window === "undefined") return null;

  try {
    const nextRaw = localStorage.getItem(sectionSubVersionsKey(resumeId));
    if (nextRaw) {
      const parsed = JSON.parse(nextRaw);
      const store = parseSectionSubVersionsStore(parsed);
      if (store) return store;
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

  const workEntries = store.entrySections.work.order.flatMap((id) => {
    const entryModule = store.entrySections.work.entries[id];
    if (!entryModule?.enabled) return [];
    const version = entryModule.versions.find((item) => item.id === entryModule.activeVersionId) ?? entryModule.versions[0];
    return version ? [{ ...jsonClone(entryModule.facts), ...jsonClone(version.content) }] : [];
  });
  const projectEntries = store.entrySections.project.order.flatMap((id) => {
    const entryModule = store.entrySections.project.entries[id];
    if (!entryModule?.enabled) return [];
    const version = entryModule.versions.find((item) => item.id === entryModule.activeVersionId) ?? entryModule.versions[0];
    return version ? [{ ...jsonClone(entryModule.facts), ...jsonClone(version.content) }] : [];
  });

  return normalizeResumeContent({
    basic_info: pick("basic_info"),
    summary: pick("summary"),
    work: { entries: workEntries },
    education: pick("education"),
    project: { entries: projectEntries },
    skills: pick("skills"),
  });
}

export function setEntryEnabled(
  store: SectionSubVersionsStore,
  sectionId: EntrySectionId,
  entryId: string,
  enabled: boolean
): SectionSubVersionsStore {
  const section = store.entrySections[sectionId];
  const entry = section.entries[entryId];
  if (!entry || entry.enabled === enabled) return store;
  return {
    ...store,
    entrySections: {
      ...store.entrySections,
      [sectionId]: {
        ...section,
        entries: { ...section.entries, [entryId]: { ...entry, enabled } },
      },
    },
  };
}

export function reorderEntryModules(
  store: SectionSubVersionsStore,
  sectionId: EntrySectionId,
  fromIndex: number,
  toIndex: number
): SectionSubVersionsStore {
  const section = store.entrySections[sectionId];
  const order = reorderList(section.order, fromIndex, toIndex);
  return order === section.order
    ? store
    : {
        ...store,
        entrySections: {
          ...store.entrySections,
          [sectionId]: { ...section, order },
        },
      };
}

export function addEntryModule(
  store: SectionSubVersionsStore,
  sectionId: EntrySectionId
): SectionSubVersionsStore {
  const section = store.entrySections[sectionId];
  const id = newId();
  const split = sectionId === "work" ? splitWorkEntry(emptyWorkEntry()) : splitProjectEntry(emptyProjectEntry());
  const version = createSubVersion("默认", split.variant);
  const entry = { id, enabled: true, facts: split.facts, activeVersionId: version.id, versions: [version] };
  return {
    ...store,
    entrySections: {
      ...store.entrySections,
      [sectionId]: {
        order: [...section.order, id],
        entries: { ...section.entries, [id]: entry },
      },
    },
  } as SectionSubVersionsStore;
}

export function deleteEntryModule(
  store: SectionSubVersionsStore,
  sectionId: EntrySectionId,
  entryId: string
): SectionSubVersionsStore {
  const section = store.entrySections[sectionId];
  if (!section.entries[entryId]) return store;
  const entries = { ...section.entries };
  delete entries[entryId];
  return {
    ...store,
    entrySections: {
      ...store.entrySections,
      [sectionId]: { order: section.order.filter((id) => id !== entryId), entries },
    },
  } as SectionSubVersionsStore;
}

export function updateEntryFacts(
  store: SectionSubVersionsStore,
  sectionId: EntrySectionId,
  entryId: string,
  facts: WorkEntryFacts | ProjectEntryFacts
): SectionSubVersionsStore {
  const section = store.entrySections[sectionId];
  const entry = section.entries[entryId];
  if (!entry) return store;
  return {
    ...store,
    entrySections: {
      ...store.entrySections,
      [sectionId]: { ...section, entries: { ...section.entries, [entryId]: { ...entry, facts: jsonClone(facts) } } },
    },
  } as SectionSubVersionsStore;
}

export function updateActiveEntryVersionContent(
  store: SectionSubVersionsStore,
  sectionId: EntrySectionId,
  entryId: string,
  content: WorkEntryVariant | ProjectEntryVariant
): SectionSubVersionsStore {
  const section = store.entrySections[sectionId];
  const entry = section.entries[entryId];
  if (!entry) return store;
  const versions = entry.versions.map((version) =>
    version.id === entry.activeVersionId ? { ...version, content: jsonClone(content) } : version
  );
  return {
    ...store,
    entrySections: {
      ...store.entrySections,
      [sectionId]: { ...section, entries: { ...section.entries, [entryId]: { ...entry, versions } } },
    },
  } as SectionSubVersionsStore;
}

export function setActiveEntryVersion(store: SectionSubVersionsStore, sectionId: EntrySectionId, entryId: string, versionId: string): SectionSubVersionsStore {
  const section = store.entrySections[sectionId];
  const entry = section.entries[entryId];
  if (!entry?.versions.some((version) => version.id === versionId)) return store;
  return {
    ...store,
    entrySections: { ...store.entrySections, [sectionId]: { ...section, entries: { ...section.entries, [entryId]: { ...entry, activeVersionId: versionId } } } },
  } as SectionSubVersionsStore;
}

export function addEntryVersion(store: SectionSubVersionsStore, sectionId: EntrySectionId, entryId: string, name: string, options?: { content?: WorkEntryVariant | ProjectEntryVariant; createdBy?: SectionCreatedBy }): SectionSubVersionsStore {
  const section = store.entrySections[sectionId];
  const entry = section.entries[entryId];
  if (!entry) return store;
  const active = entry.versions.find((version) => version.id === entry.activeVersionId) ?? entry.versions[0];
  const version = createSubVersion(name.trim() || "新版本", options?.content ?? active.content, options?.createdBy ?? "user");
  return {
    ...store,
    entrySections: { ...store.entrySections, [sectionId]: { ...section, entries: { ...section.entries, [entryId]: { ...entry, activeVersionId: version.id, versions: [...entry.versions, version] } } } },
  } as SectionSubVersionsStore;
}

export function renameEntryVersion(store: SectionSubVersionsStore, sectionId: EntrySectionId, entryId: string, versionId: string, name: string): SectionSubVersionsStore {
  const section = store.entrySections[sectionId];
  const entry = section.entries[entryId];
  if (!entry || !name.trim()) return store;
  const versions = entry.versions.map((version) => version.id === versionId ? { ...version, name: name.trim() } : version);
  return { ...store, entrySections: { ...store.entrySections, [sectionId]: { ...section, entries: { ...section.entries, [entryId]: { ...entry, versions } } } } } as SectionSubVersionsStore;
}

export function duplicateEntryVersion(store: SectionSubVersionsStore, sectionId: EntrySectionId, entryId: string, versionId: string): SectionSubVersionsStore {
  const entry = store.entrySections[sectionId].entries[entryId];
  const source = entry?.versions.find((version) => version.id === versionId);
  return source ? addEntryVersion(store, sectionId, entryId, `${source.name} 副本`, { content: source.content }) : store;
}

export function deleteEntryVersion(store: SectionSubVersionsStore, sectionId: EntrySectionId, entryId: string, versionId: string): SectionSubVersionsStore {
  const section = store.entrySections[sectionId];
  const entry = section.entries[entryId];
  if (!entry || entry.versions.length <= 1) return store;
  const versions = entry.versions.filter((version) => version.id !== versionId);
  if (versions.length === entry.versions.length) return store;
  const activeVersionId = entry.activeVersionId === versionId ? versions[0].id : entry.activeVersionId;
  return { ...store, entrySections: { ...store.entrySections, [sectionId]: { ...section, entries: { ...section.entries, [entryId]: { ...entry, activeVersionId, versions } } } } } as SectionSubVersionsStore;
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
  const standard = (["basic_info", "summary", "education", "skills"] as StandardSectionId[])
    .reduce((sum, id) => sum + store.sections[id].versions.length, 0);
  const entries = (["work", "project"] as EntrySectionId[]).reduce(
    (sum, sectionId) =>
      sum + Object.values(store.entrySections[sectionId].entries)
        .reduce((entrySum, entry) => entrySum + entry.versions.length, 0),
    0
  );
  return standard + entries;
}
