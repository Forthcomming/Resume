import { NextResponse } from "next/server";
import { AIError } from "@/lib/ai/deepseek-client";
import { generateJdAdaptationPlan } from "@/lib/ai/jd-plan";
import { DEEPSEEK_API_KEY_HEADER } from "@/lib/ai/user-api-key";
import { normalizeResumeContent, type ResumeContent } from "@/lib/resume/content";
import { parseSectionSubVersionsStore } from "@/lib/resume/versions";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() : "";
  const jobDescription =
    typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";
  const versionStore = parseSectionSubVersionsStore(body.versionStore);
  if (!jobTitle) {
    return NextResponse.json({ error: "请填写目标岗位名称" }, { status: 400 });
  }
  if (jobDescription.length < 80) {
    return NextResponse.json(
      { error: "JD 信息不足，请补充岗位职责和任职要求" },
      { status: 400 }
    );
  }
  if (!body.content || !versionStore) {
    return NextResponse.json(
      { error: "当前简历内容或版本数据无效" },
      { status: 400 }
    );
  }

  try {
    const result = await generateJdAdaptationPlan({
      title: typeof body.title === "string" ? body.title : "未命名简历",
      content: normalizeResumeContent(body.content as Partial<ResumeContent>),
      versionStore,
      companyName:
        typeof body.companyName === "string" ? body.companyName : "",
      jobTitle,
      jobDescription,
      apiKey: request.headers.get(DEEPSEEK_API_KEY_HEADER),
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[resume/jd-plan] unexpected error", error);
    return NextResponse.json(
      { error: "岗位适配失败，请稍后重试" },
      { status: 500 }
    );
  }
}
