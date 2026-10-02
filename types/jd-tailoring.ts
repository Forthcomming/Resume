import type { EntrySectionId, StandardSectionId } from "@/lib/resume/versions";

export type JdCoverage = "covered" | "weak" | "missing";
export type JdImportance = "core" | "bonus";

export interface JdRequirement {
  id: string;
  title: string;
  jdQuote: string;
  importance: JdImportance;
  coverage: JdCoverage;
}

export type ResumeEvidence =
  | { id: string; source: "entry"; requirementId: string; sectionId: EntrySectionId; entryId: string; entryVersionId: string; entryLabel: string; versionName: string; bulletIndex: number; text: string; reason: string; isActive: boolean; isEnabled: boolean }
  | { id: string; source: "section"; requirementId: string; sectionId: StandardSectionId; versionId: string; versionName: string; entryIndex?: number; bulletIndex?: number; text: string; reason: string; isActive: boolean };

interface ActionBase { id: string; reason: string; requirementIds: string[] }

export type JdRecommendationAction =
  | (ActionBase & { type: "set_entry_enabled"; sectionId: EntrySectionId; entryId: string; enabled: boolean })
  | (ActionBase & { type: "switch_entry_version"; sectionId: EntrySectionId; entryId: string; fromVersionId: string; toVersionId: string })
  | (ActionBase & { type: "rewrite_entry_bullet"; sectionId: EntrySectionId; entryId: string; versionId: string; bulletIndex: number; original: string; suggested: string })
  | (ActionBase & { type: "switch_section_version"; sectionId: StandardSectionId; fromVersionId: string; toVersionId: string })
  | (ActionBase & { type: "rewrite_education_bullet"; sectionId: "education"; versionId: string; entryIndex: number; bulletIndex: number; original: string; suggested: string });

export interface JdAdaptationPlan {
  sourceFingerprint: string;
  jobTitle: string;
  companyName: string;
  requirements: JdRequirement[];
  evidence: ResumeEvidence[];
  actions: JdRecommendationAction[];
}

export interface SelectedTailoringActions { actionIds: string[] }
