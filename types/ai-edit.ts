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
      status: "analyzing" | "generating";
      target: EditTarget;
      instruction: string;
      original: unknown;
    }
  /** @deprecated Kept for redcowork-demo path-alias compatibility. Prefer analyzing/generating. */
  | {
      status: "loading";
      target: EditTarget;
      instruction: string;
      original: unknown;
      suggested?: unknown;
      error?: string;
    }
  | ({
      target: EditTarget;
      instruction: string;
    } & AIEditNeedsInputResult)
  | ({
      target: EditTarget;
      instruction: string;
      status: "ready";
      original: unknown;
      suggested: unknown;
      improvements?: string[];
    })
  | {
      status: "error";
      target: EditTarget;
      instruction: string;
      original: unknown;
      suggested?: unknown;
      error: string;
    };
