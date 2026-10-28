import { NextResponse } from "next/server";
import {
  editSectionContent,
  editSectionContentAdaptive,
} from "@/lib/ai/edit-section";
import { AIError } from "@/lib/ai/deepseek";
import { DEEPSEEK_API_KEY_HEADER } from "@/lib/ai/user-api-key";
import type { AIEditAnswers, EditTarget } from "@/types/ai-edit";

export const runtime = "nodejs";
export const maxDuration = 60;

function cleanAnswers(value: unknown): AIEditAnswers | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([id, answer]) => [
      id,
      typeof answer === "string" ? answer.trim() : "",
    ] as const)
    .filter(([, answer]) => answer.length > 0)
    .slice(0, 3);
  if (!entries.length) return undefined;
  return Object.fromEntries(entries);
}

export async function POST(request: Request) {
  let body: {
    target?: EditTarget;
    content?: unknown;
    instruction?: string;
    workflow?: string;
    answers?: unknown;
    conservative?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const { target, content, instruction, workflow } = body;

  if (!target || content === undefined || !instruction?.trim()) {
    return NextResponse.json(
      { error: "缺少 target、content 或 instruction" },
      { status: 400 }
    );
  }

  const userApiKey = request.headers.get(DEEPSEEK_API_KEY_HEADER);

  try {
    if (workflow === "adaptive") {
      const result = await editSectionContentAdaptive({
        target,
        content,
        instruction: instruction.trim(),
        apiKey: userApiKey,
        answers: cleanAnswers(body.answers),
        conservative: body.conservative === true,
      });
      return NextResponse.json(result);
    }

    const result = await editSectionContent({
      target,
      content,
      instruction: instruction.trim(),
      apiKey: userApiKey,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AIError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[resume/edit] unexpected error", err);
    return NextResponse.json({ error: "AI 编辑失败，请稍后重试" }, { status: 500 });
  }
}
