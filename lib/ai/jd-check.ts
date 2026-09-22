import { AIError, resolveDeepseekApiKey } from "@/lib/ai/deepseek";
import type { ResumeContent } from "@/lib/resume/content";
import { SECTION_IDS } from "@/lib/resume/versions";
import type { JdCheckIssue, JdCheckResult, JdIssueSeverity } from "@/types/jd-check";
import type { SectionId } from "@/types/ai-edit";

const SYSTEM_PROMPT = `你是中文简历投递顾问。根据目标岗位 JD，检查简历内容存在的匹配问题。
规则：
- 只输出 JSON，不要解释，不要 markdown 代码块。
- 最多返回 5 条问题，按严重程度从高到低。
- 不要编造简历没有的经历；只指出缺口、弱表达、排序或关键词覆盖问题。
- sectionId 只能是：basic_info | summary | work | education | project | skills
- severity 只能是：high | medium | low
- instruction 必须是可直接用于改写该板块的中文指令，具体、可执行。

输出结构：
{
  "issues": [
    {
      "severity": "high",
      "title": "一句话问题",
      "evidence": "对应 JD 的哪句要求或缺口说明",
      "sectionId": "summary",
      "instruction": "请针对该 JD 要求改写本板块……"
    }
  ]
}`;

function stripCodeFence(s: string): string {
  const trimmed = s.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/, "")
      .trim();
  }
  return trimmed;
}

function asSeverity(value: unknown): JdIssueSeverity {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
}

function asSectionId(value: unknown): SectionId {
  if (typeof value === "string" && (SECTION_IDS as string[]).includes(value)) {
    return value as SectionId;
  }
  return "summary";
}

function compactResume(content: ResumeContent): unknown {
  return {
    basic_info: {
      name: content.basic_info.name,
      desired_position: content.basic_info.desired_position,
      target_cities: content.basic_info.target_cities,
    },
    summary: content.summary,
    work: content.work,
    education: content.education,
    project: content.project,
    skills: content.skills,
  };
}

export async function checkResumeAgainstJd(params: {
  content: ResumeContent;
  jobTitle: string;
  jobDescription: string;
  apiKey?: string | null;
}): Promise<JdCheckResult> {
  const apiKey = resolveDeepseekApiKey(params.apiKey);
  const jobTitle = params.jobTitle.trim();
  const jobDescription = params.jobDescription.trim();
  if (!jobDescription) {
    throw new AIError("请先粘贴岗位 JD", 400);
  }

  const baseUrl = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `目标岗位：${jobTitle || "未填写"}

岗位 JD：
${jobDescription.slice(0, 12000)}

当前简历（JSON）：
${JSON.stringify(compactResume(params.content), null, 2)}

请返回最多 5 条匹配问题。`,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AIError("检查超时，请稍后重试", 504);
    }
    throw new AIError("无法连接 DeepSeek 服务", 502);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new AIError(
      `DeepSeek 返回错误（${res.status}）${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      502
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) {
    throw new AIError("DeepSeek 未返回有效内容", 502);
  }

  let parsed: { issues?: unknown };
  try {
    parsed = JSON.parse(stripCodeFence(raw));
  } catch {
    throw new AIError("检查结果不是合法 JSON", 502);
  }

  const issuesRaw = Array.isArray(parsed.issues) ? parsed.issues : [];
  const issues: JdCheckIssue[] = issuesRaw
    .slice(0, 5)
    .map((item, index) => {
      const row = (item ?? {}) as Record<string, unknown>;
      const title =
        typeof row.title === "string" && row.title.trim()
          ? row.title.trim()
          : `问题 ${index + 1}`;
      const evidence =
        typeof row.evidence === "string" && row.evidence.trim()
          ? row.evidence.trim()
          : "请对照 JD 要求检查该板块表达。";
      const instruction =
        typeof row.instruction === "string" && row.instruction.trim()
          ? row.instruction.trim()
          : `请针对目标岗位「${jobTitle || "该岗位"}」优化本板块，补齐 JD 要求并强化匹配表达。`;
      return {
        id: `jd-issue-${index + 1}`,
        severity: asSeverity(row.severity),
        title,
        evidence,
        sectionId: asSectionId(row.sectionId),
        instruction,
      };
    })
    .filter((issue) => issue.title.length > 0);

  return { issues };
}
