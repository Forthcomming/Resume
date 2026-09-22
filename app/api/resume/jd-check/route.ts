import { NextResponse } from "next/server";
import { checkResumeAgainstJd } from "@/lib/ai/jd-check";
import { AIError } from "@/lib/ai/deepseek";
import { DEEPSEEK_API_KEY_HEADER } from "@/lib/ai/user-api-key";
import { normalizeResumeContent, type ResumeContent } from "@/lib/resume/content";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: {
    content?: ResumeContent;
    jobTitle?: string;
    jobDescription?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  if (!body.content || typeof body.jobDescription !== "string") {
    return NextResponse.json(
      { error: "缺少 content 或 jobDescription" },
      { status: 400 }
    );
  }

  const userApiKey = request.headers.get(DEEPSEEK_API_KEY_HEADER);

  try {
    const result = await checkResumeAgainstJd({
      content: normalizeResumeContent(body.content),
      jobTitle: body.jobTitle ?? "",
      jobDescription: body.jobDescription,
      apiKey: userApiKey,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AIError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[resume/jd-check] unexpected error", err);
    return NextResponse.json({ error: "JD 检查失败，请稍后重试" }, { status: 500 });
  }
}
