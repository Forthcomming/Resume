import { NextResponse } from "next/server";
import { extractResumeText, ExtractError } from "@/lib/resume/extract";
import { parseResumeText, AIError } from "@/lib/ai/deepseek";
import { createResume } from "@/services/resumes";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let file: File | null = null;
  try {
    const form = await request.formData();
    const value = form.get("file");
    if (value instanceof File) file = value;
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "未收到文件" }, { status: 400 });
  }

  try {
    const text = await extractResumeText(file);
    const { title, content } = await parseResumeText(text);

    const persistedId = await createResume(title, content);

    return NextResponse.json({
      id: persistedId ?? crypto.randomUUID(),
      title,
      content,
      persisted: persistedId !== null,
    });
  } catch (err) {
    if (err instanceof ExtractError || err instanceof AIError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[resume/parse] unexpected error", err);
    return NextResponse.json({ error: "解析失败，请稍后重试" }, { status: 500 });
  }
}
