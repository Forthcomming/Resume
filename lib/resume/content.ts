// Structured section content model (see docs/resume-optimizer-prd.md §5)

export interface BasicInfoContent {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
}

export interface SummaryContent {
  text: string;
}

export interface EducationEntry {
  school: string;
  degree: string;
  major: string;
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
    linkedin: "",
    github: "",
    website: "",
  };
}

export function emptyEducationEntry(): EducationEntry {
  return {
    school: "",
    degree: "",
    major: "",
    startDate: "",
    endDate: "",
    gpa: "",
    notes: [],
  };
}

export function emptyWorkEntry(): WorkEntry {
  return {
    company: "",
    title: "",
    location: "",
    startDate: "",
    endDate: "",
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
    bullets: [""],
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
    work: { entries: raw.work?.entries ?? base.work.entries },
    education: { entries: raw.education?.entries ?? base.education.entries },
    project: { entries: raw.project?.entries ?? base.project.entries },
    skills: { categories: raw.skills?.categories ?? base.skills.categories },
  };
}
