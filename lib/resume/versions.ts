import {
  emptyResumeContent,
  normalizeResumeContent,
  type ResumeContent,
} from "@/lib/resume/content";

export type SectionId = keyof ResumeContent;

export interface ResumeVersion {
  id: string;
  name: string;
  content: ResumeContent;
  createdAt: string;
}

/** Which named version each section pulls content from when composing. */
export type SectionCompose = Record<SectionId, string>;

export interface VersionStore {
  versions: ResumeVersion[];
  compose: SectionCompose;
}

const SECTION_IDS: SectionId[] = [
  "basic_info",
  "summary",
  "work",
  "education",
  "project",
  "skills",
];

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

function defaultCompose(versionId: string): SectionCompose {
  return SECTION_IDS.reduce(
    (acc, id) => {
      acc[id] = versionId;
      return acc;
    },
    {} as SectionCompose
  );
}

export function createVersion(
  name: string,
  content: ResumeContent,
  id = newId()
): ResumeVersion {
  return {
    id,
    name,
    content: normalizeResumeContent(content),
    createdAt: nowIso(),
  };
}

/** Build initial store from a single content blob. */
export function initVersionStore(content: ResumeContent): VersionStore {
  const defaultVersion = createVersion("默认", content);
  return {
    versions: [defaultVersion],
    compose: defaultCompose(defaultVersion.id),
  };
}

export function readVersionStore(resumeId: string): VersionStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(resumeVersionsKey(resumeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VersionStore;
    if (!parsed.versions?.length) return null;
    return sanitizeVersionStore(parsed);
  } catch {
    return null;
  }
}

/** Ensure compose mappings always point at existing versions. */
export function sanitizeVersionStore(store: VersionStore): VersionStore {
  const versions = store.versions.map((v) => ({
    ...v,
    content: normalizeResumeContent(v.content),
  }));
  const fallbackId = versions[0]?.id;
  if (!fallbackId) return initVersionStore(emptyResumeContent());

  const validIds = new Set(versions.map((v) => v.id));
  const compose = defaultCompose(fallbackId);
  for (const sectionId of SECTION_IDS) {
    const mapped = store.compose?.[sectionId];
    compose[sectionId] =
      mapped && validIds.has(mapped) ? mapped : fallbackId;
  }

  return { versions, compose };
}

export function saveVersionStore(resumeId: string, store: VersionStore): void {
  localStorage.setItem(resumeVersionsKey(resumeId), JSON.stringify(store));
}

/** Merge sections from different named versions into one preview/export content. */
export function composeContent(store: VersionStore): ResumeContent {
  const byId = new Map(store.versions.map((v) => [v.id, v]));

  const pick = <K extends SectionId>(id: K): ResumeContent[K] => {
    const versionId = store.compose[id];
    const version = byId.get(versionId);
    if (version) return jsonClone(version.content[id]);
    return emptyResumeContent()[id];
  };

  return {
    basic_info: pick("basic_info"),
    summary: pick("summary"),
    work: pick("work"),
    education: pick("education"),
    project: pick("project"),
    skills: pick("skills"),
  };
}

export function addVersion(
  store: VersionStore,
  name: string,
  content: ResumeContent
): VersionStore {
  const version = createVersion(name, content);
  return { ...store, versions: [...store.versions, version] };
}

export function renameVersion(
  store: VersionStore,
  versionId: string,
  name: string
): VersionStore {
  return {
    ...store,
    versions: store.versions.map((v) =>
      v.id === versionId ? { ...v, name: name.trim() || v.name } : v
    ),
  };
}

export function duplicateVersion(
  store: VersionStore,
  versionId: string,
  name?: string
): VersionStore {
  const source = store.versions.find((v) => v.id === versionId);
  if (!source) return store;
  const copy = createVersion(
    name ?? `${source.name} 副本`,
    source.content
  );
  return { ...store, versions: [...store.versions, copy] };
}

export function updateVersionContent(
  store: VersionStore,
  versionId: string,
  content: ResumeContent
): VersionStore {
  return {
    ...store,
    versions: store.versions.map((v) =>
      v.id === versionId
        ? { ...v, content: normalizeResumeContent(content) }
        : v
    ),
  };
}

export function updateVersionSection(
  store: VersionStore,
  versionId: string,
  sectionId: SectionId,
  sectionContent: ResumeContent[SectionId]
): VersionStore {
  return {
    ...store,
    versions: store.versions.map((v) =>
      v.id === versionId
        ? {
            ...v,
            content: {
              ...v.content,
              [sectionId]: jsonClone(sectionContent),
            },
          }
        : v
    ),
  };
}

export function setSectionSource(
  store: VersionStore,
  sectionId: SectionId,
  versionId: string
): VersionStore {
  return {
    ...store,
    compose: { ...store.compose, [sectionId]: versionId },
  };
}

export function getVersion(
  store: VersionStore,
  versionId: string
): ResumeVersion | undefined {
  return store.versions.find((v) => v.id === versionId);
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
