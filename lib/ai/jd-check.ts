import { AIError, requestDeepseekJson } from "@/lib/ai/deepseek-client";
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
  const jobTitle = params.jobTitle.trim();
  const jobDescription = params.jobDescription.trim();
  if (!jobDescription) {
    throw new AIError("请先粘贴岗位 JD", 400);
  }

  const userPrompt = `目标岗位：${jobTitle || "未填写"}

岗位 JD：
${jobDescription.slice(0, 12000)}

当前简历（JSON）：
${JSON.stringify(compactResume(params.content), null, 2)}

请返回最多 5 条匹配问题。`;

  const parsed = await requestDeepseekJson<{ issues?: unknown }>({
    apiKey: params.apiKey,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.3,
    errors: {
      timeout: "检查超时，请稍后重试",
      connection: "无法连接 DeepSeek 服务",
      empty: "DeepSeek 未返回有效内容",
      invalidJson: "检查结果不是合法 JSON",
    },
  });

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
