import type {
  AIEditAnswers,
  AIEditResult,
  EditTarget,
} from "@/types/ai-edit";
import type { ResumeContent } from "@/lib/resume/content";
import { deepseekAuthHeaders } from "@/lib/ai/user-api-key";

/** Extract the content slice sent to the AI API based on edit target. */
export function getEditSlice(
  content: ResumeContent,
  target: EditTarget
): unknown {
  if (
    target.scope === "section" ||
    target.scope === "field" ||
    target.scope === "bullet"
  ) {
    return content[target.sectionId];
  }
  return content;
}

/** Apply an accepted AI suggestion back into full resume content. */
export function applyAIEdit(
  content: ResumeContent,
  target: EditTarget,
  suggested: unknown
): ResumeContent {
  if (
    target.scope === "section" ||
    target.scope === "field" ||
    target.scope === "bullet"
  ) {
    return {
      ...content,
      [target.sectionId]: suggested as ResumeContent[typeof target.sectionId],
    };
  }
  return content;
}

/** Client-side call to the one-shot edit API (used by JD tailor retry). */
export async function requestAIEdit(
  target: EditTarget,
  content: unknown,
  instruction: string
): Promise<{ original: unknown; suggested: unknown }> {
  const res = await fetch("/api/resume/edit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...deepseekAuthHeaders(),
    },
    body: JSON.stringify({ target, content, instruction }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "AI 编辑失败");
  }
  return data;
}

/** Client-side call to the adaptive editor edit API. */
export async function requestAdaptiveAIEdit(
  target: EditTarget,
  content: unknown,
  instruction: string,
  options: {
    answers?: AIEditAnswers;
    conservative?: boolean;
  } = {}
): Promise<AIEditResult> {
  const res = await fetch("/api/resume/edit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...deepseekAuthHeaders(),
    },
    body: JSON.stringify({
      target,
      content,
      instruction,
      workflow: "adaptive",
      answers: options.answers,
      conservative: options.conservative === true,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "AI 编辑失败");
  }
  return data as AIEditResult;
}
