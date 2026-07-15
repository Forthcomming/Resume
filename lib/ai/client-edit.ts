import type { EditTarget } from "@/types/ai-edit";
import type { ResumeContent } from "@/lib/resume/content";
import { deepseekAuthHeaders } from "@/lib/ai/user-api-key";

function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Extract the content slice sent to the AI API based on edit target. */
export function getEditSlice(
  content: ResumeContent,
  target: EditTarget
): unknown {
  if (target.scope === "section") {
    return content[target.sectionId];
  }
  if (target.scope === "field") {
    return content[target.sectionId];
  }
  if (target.scope === "bullet") {
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
  if (target.scope === "section") {
    return {
      ...content,
      [target.sectionId]: suggested as ResumeContent[typeof target.sectionId],
    };
  }

  if (target.scope === "field") {
    return {
      ...content,
      [target.sectionId]: suggested as ResumeContent[typeof target.sectionId],
    };
  }

  if (target.scope === "bullet") {
    const section = jsonClone(content[target.sectionId]) as {
      entries: Array<{ bullets?: string[]; notes?: string[] }>;
    };
    const suggestedSection = suggested as typeof section;
    return {
      ...content,
      [target.sectionId]: suggestedSection,
    };
  }

  return content;
}

/** Client-side call to the edit API. */
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
