import type { SectionId } from "@/types/ai-edit";

export type JdCoverage = "covered" | "weak" | "missing";
export type JdImportance = "core" | "bonus";

export interface JdRequirement {
  id: string;
  title: string;
  jdQuote: string;
  importance: JdImportance;
  coverage: JdCoverage;
}

export interface ResumeEvidence {
  id: string;
  requirementId: string;
  sectionId: SectionId;
  versionId: string;
  versionName: string;
  entryIndex?: number;
  bulletIndex?: number;
  text: string;
  reason: string;
  isActive: boolean;
}

export type JdRecommendationAction =
  | {
      id: string;
      type: "keep";
      sectionId: SectionId;
      versionId: string;
      reason: string;
    }
  | {
      id: string;
      type: "switch_version";
      sectionId: SectionId;
      fromVersionId: string;
      toVersionId: string;
      reason: string;
      requirementIds: string[];
    }
  | {
      id: string;
      type: "rewrite_bullet";
      sectionId: "work" | "project" | "education";
      versionId: string;
      entryIndex: number;
      bulletIndex: number;
      original: string;
      suggested: string;
      reason: string;
      requirementIds: string[];
    };

export interface JdAdaptationPlan {
  sourceFingerprint: string;
  jobTitle: string;
  companyName: string;
  requirements: JdRequirement[];
  evidence: ResumeEvidence[];
  targetVersionBySection: Partial<Record<SectionId, string>>;
  actions: JdRecommendationAction[];
}

export interface SelectedTailoringActions {
  switchActionIds: string[];
  rewriteActionIds: string[];
}
