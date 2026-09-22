import type { SectionId } from "@/types/ai-edit";

export type JdIssueSeverity = "high" | "medium" | "low";

export type JdCheckIssue = {
  id: string;
  severity: JdIssueSeverity;
  title: string;
  evidence: string;
  sectionId: SectionId;
  instruction: string;
};

export type JdCheckResult = {
  issues: JdCheckIssue[];
};
