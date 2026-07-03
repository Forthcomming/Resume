import { NextResponse } from "next/server";
import { editSectionContent } from "@/lib/ai/edit-section";
import { AIError } from "@/lib/ai/deepseek";
import type { EditTarget } from "@/types/ai-edit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: {
    target?: EditTarget;
    content?: unknown;
    instruction?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const { target, content, instruction } = body;

  if (!target || content === undefined || !instruction?.trim()) {
    return NextResponse.json(
      { error: "缺少 target、content 或 instruction" },
      { status: 400 }
    );
  }

  try {
    const result = await editSectionContent({
      target,
      content,
      instruction: instruction.trim(),
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
