// Structured section content model (see docs/resume-optimizer-prd.md §5)

export interface BasicInfoContent {
  name: string;
  email: string;
  phone: string;
  /** 现居城市 */
  location: string;
  /** Data URL or remote URL */
  avatar: string;
  /** 意向城市 */
  target_cities: string;
  /** 期望职位 */
  desired_position: string;
  /** 个人网站 / 作品集 / GitHub */
  website: string;
  wechat: string;
  linkedin: string;
  /** @deprecated kept for imported resume compatibility */
  github: string;
  gender: string;
  height: string;
  weight: string;
  ethnicity: string;
  native_place: string;
  political_status: string;
  marital_status: string;
  /** 年龄或生日 */
  birthday: string;
}

export interface SummaryContent {
  text: string;
}

export interface EducationEntry {
  school: string;
  /** 学校标签：985 / 211 / 双一流 等 */
  schoolTag: string;
  major: string;
  /** 学历 */
  degree: string;
  /** 就读类型：全日制 / 非全日制 等 */
  studyType: string;
  /** 学院 / 院系 */
  college: string;
  /** 所在城市 */
  city: string;
  startDate: string; // YYYY-MM
  endDate: string; // YYYY-MM or present
  gpa: string;
  notes: string[];
}

export interface EducationContent {
  entries: EducationEntry[];
}

export interface WorkEntry {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  /** Optional one-line summary shown bold above bullets */
  summary?: string;
  bullets: string[];
}

export interface WorkExperienceContent {
  entries: WorkEntry[];
}

export interface ProjectEntry {
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  techStack: string[];
  link: string;
  /** Optional one-line summary shown bold above bullets */
  summary?: string;
  bullets: string[];
}

export interface ProjectContent {
  entries: ProjectEntry[];
}

export interface SkillCategory {
  label: string;
  items: string[];
}

export interface SkillsContent {
  categories: SkillCategory[];
}

/**
 * Full editable content for a resume, keyed by editor section id.
 * Mirrors the section ids in components/resume/editor/sections.ts.
 */
export interface ResumeContent {
  basic_info: BasicInfoContent;
  summary: SummaryContent;
  work: WorkExperienceContent;
  education: EducationContent;
  project: ProjectContent;
  skills: SkillsContent;
}

export function emptyBasicInfo(): BasicInfoContent {
  return {
    name: "",
    email: "",
    phone: "",
    location: "",
    avatar: "",
    target_cities: "",
    desired_position: "",
    website: "",
    wechat: "",
    linkedin: "",
    github: "",
    gender: "",
    height: "",
    weight: "",
    ethnicity: "",
    native_place: "",
    political_status: "",
    marital_status: "",
    birthday: "",
  };
}

export function emptyEducationEntry(): EducationEntry {
  return {
    school: "",
    schoolTag: "",
    major: "",
    degree: "",
    studyType: "",
    college: "",
    city: "",
    startDate: "",
    endDate: "",
    gpa: "",
    notes: [],
  };
}

export function normalizeEducationEntry(
  raw: Partial<EducationEntry> | null | undefined
): EducationEntry {
  const base = emptyEducationEntry();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    notes: Array.isArray(raw.notes) ? raw.notes : base.notes,
  };
}

export function emptyWorkEntry(): WorkEntry {
  return {
    company: "",
    title: "",
    location: "",
    startDate: "",
    endDate: "",
    summary: "",
    bullets: [""],
  };
}

export function emptyProjectEntry(): ProjectEntry {
  return {
    name: "",
    role: "",
    startDate: "",
    endDate: "",
    techStack: [],
    link: "",
    summary: "",
    bullets: [""],
  };
}

/** Heuristic: short first-bullet text that looks like a role summary (strict; prefer miss over false promote). */
export function looksLikeEntrySummary(text: string): boolean {
  const t = text.trim();
  if (t.length < 8 || t.length > 48) return false;
  if ((t.match(/[；;、]/g) ?? []).length >= 2) return false;
  if (/等$|等等$/.test(t)) return false;
  return true;
}

/** Promote first bullet to summary when missing and it looks like a summary. */
export function maybePromoteEntrySummary(entry: {
  summary?: string;
  bullets: string[];
}): { summary: string; bullets: string[] } {
  const bullets = Array.isArray(entry.bullets) ? entry.bullets : [];
  const existing = (entry.summary ?? "").trim();
  if (existing) {
    return { summary: entry.summary ?? "", bullets };
  }
  if (bullets.length < 2) {
    return { summary: "", bullets };
  }
  const first = bullets[0] ?? "";
  if (!looksLikeEntrySummary(first)) {
    return { summary: "", bullets };
  }
  return {
    summary: first.trim(),
    bullets: bullets.slice(1),
  };
}

export function normalizeWorkEntry(
  raw: Partial<WorkEntry> | null | undefined
): WorkEntry {
  const base = emptyWorkEntry();
  if (!raw) return base;
  const merged: WorkEntry = {
    ...base,
    ...raw,
    summary: typeof raw.summary === "string" ? raw.summary : base.summary,
    bullets: Array.isArray(raw.bullets) ? raw.bullets : base.bullets,
  };
  const promoted = maybePromoteEntrySummary(merged);
  return {
    ...merged,
    summary: promoted.summary,
    bullets: promoted.bullets.length > 0 ? promoted.bullets : [""],
  };
}

export function normalizeProjectEntry(
  raw: Partial<ProjectEntry> | null | undefined
): ProjectEntry {
  const base = emptyProjectEntry();
  if (!raw) return base;
  const merged: ProjectEntry = {
    ...base,
    ...raw,
    summary: typeof raw.summary === "string" ? raw.summary : base.summary,
    techStack: Array.isArray(raw.techStack) ? raw.techStack : base.techStack,
    bullets: Array.isArray(raw.bullets) ? raw.bullets : base.bullets,
  };
  const promoted = maybePromoteEntrySummary(merged);
  return {
    ...merged,
    summary: promoted.summary,
    bullets: promoted.bullets.length > 0 ? promoted.bullets : [""],
  };
}

export function emptySkillCategory(): SkillCategory {
  return { label: "", items: [] };
}

export function emptyResumeContent(): ResumeContent {
  return {
    basic_info: emptyBasicInfo(),
    summary: { text: "" },
    work: { entries: [] },
    education: { entries: [] },
    project: { entries: [] },
    skills: { categories: [] },
  };
}

/**
 * Merge a partial/persisted content blob onto the empty defaults so that
 * missing keys never break the editor.
 */
export function normalizeResumeContent(
  raw: Partial<ResumeContent> | null | undefined
): ResumeContent {
  const base = emptyResumeContent();
  if (!raw) return base;
  return {
    basic_info: { ...base.basic_info, ...raw.basic_info },
    summary: { ...base.summary, ...raw.summary },
    work: {
      entries: (raw.work?.entries ?? base.work.entries).map(normalizeWorkEntry),
    },
    education: {
      entries: (raw.education?.entries ?? base.education.entries).map(
        normalizeEducationEntry
      ),
    },
    project: {
      entries: (raw.project?.entries ?? base.project.entries).map(
        normalizeProjectEntry
      ),
    },
    skills: { categories: raw.skills?.categories ?? base.skills.categories },
  };
}

/** Normalize a single section blob (e.g. legacy localStorage without new basic_info keys). */
export function normalizeSectionContent<K extends keyof ResumeContent>(
  sectionId: K,
  raw: Partial<ResumeContent[K]> | null | undefined
): ResumeContent[K] {
  return normalizeResumeContent({ [sectionId]: raw } as Partial<ResumeContent>)[
    sectionId
  ];
}
