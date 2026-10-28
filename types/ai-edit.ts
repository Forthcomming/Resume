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

export type AIEditAnswers = Record<string, string>;

export type AIEditClarificationQuestion = {
  id: string;
  question: string;
  placeholder?: string;
};

export type AIEditReadyResult = {
  status: "ready";
  original: unknown;
  suggested: unknown;
  improvements: string[];
};

export type AIEditNeedsInputResult = {
  status: "needs_input";
  original: unknown;
  diagnosis: string;
  questions: AIEditClarificationQuestion[];
};

export type AIEditResult = AIEditReadyResult | AIEditNeedsInputResult;

export type PendingAIEdit =
  | {
      status: "analyzing";
      target: EditTarget;
      instruction: string;
      original: unknown;
    }
  | ({
      target: EditTarget;
      instruction: string;
    } & AIEditNeedsInputResult)
  | {
      status: "generating";
      target: EditTarget;
      instruction: string;
      original: unknown;
    }
  | ({
      target: EditTarget;
      instruction: string;
    } & AIEditReadyResult)
  | {
      status: "error";
      target: EditTarget;
      instruction: string;
      original: unknown;
      error: string;
    };
