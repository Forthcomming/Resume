import type { ResumeContent } from "@/lib/resume/content";

export type SectionId = keyof ResumeContent;

export type EditTarget =
  | { scope: "section"; sectionId: SectionId }
  | {
      scope: "bullet";
      sectionId: "work" | "project" | "education";
      entryIndex: number;
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
