import type { ResumeContent } from "@/lib/resume/content";

export type SectionId = keyof ResumeContent;

export type EditTarget =
  | { scope: "section"; sectionId: SectionId }
  | {
      scope: "bullet";
      sectionId: "education";
      entryIndex: number;
      bulletIndex: number;
    }
  | {
      scope: "bullet";
      sectionId: "work" | "project";
      entryId: string;
      entryVersionId: string;
      bulletIndex: number;
    }
  | { scope: "field"; sectionId: "summary"; field: "text" };

export type PendingAIEdit = {
  target: EditTarget;
  instruction: string;
  original: unknown;
  suggested: unknown;
  status: "loading" | "ready" | "error";
  error?: string;
};
