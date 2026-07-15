import { AIError, resolveDeepseekApiKey } from "@/lib/ai/deepseek";
import type { EditTarget } from "@/types/ai-edit";

interface EditSectionParams {
  target: EditTarget;
  content: unknown;
  instruction: string;
  apiKey?: string | null;
}

interface EditSectionResult {
  original: unknown;
  suggested: unknown;
}

const SECTION_SCHEMA_HINTS: Record<string, string> = {
  basic_info:
    '{ "name": "", "email": "", "phone": "", "location": "", "avatar": "", "target_cities": "", "desired_position": "", "website": "", "wechat": "", "linkedin": "", "github": "", "gender": "", "height": "", "weight": "", "ethnicity": "", "native_place": "", "political_status": "", "marital_status": "", "birthday": "" }',
  summary: '{ "text": "" }',
  work: '{ "entries": [{ "company": "", "title": "", "location": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM|present", "bullets": ["..."] }] }',
  education:
    '{ "entries": [{ "school": "", "schoolTag": "985|211|双一流|海外 QS Top|普通本科", "major": "", "degree": "高中|专科|本科|硕士|博士", "studyType": "全日制|非全日制|在职|交换", "college": "", "city": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM|present", "gpa": "", "notes": ["..."] }] }',
  project:
    '{ "entries": [{ "name": "", "role": "", "startDate": "", "endDate": "", "techStack": [""], "link": "", "bullets": ["..."] }] }',
  skills: '{ "categories": [{ "label": "", "items": ["..."] }] }',
};

function buildSystemPrompt(target: EditTarget): string {
  const sectionId =
    target.scope === "field" ? target.sectionId : target.sectionId;
  const schema = SECTION_SCHEMA_HINTS[sectionId] ?? "与输入相同结构";

  let scopeHint = "";
  if (target.scope === "bullet") {
    scopeHint = `仅优化第 ${target.entryIndex + 1} 条经历中的第 ${target.bulletIndex + 1} 条 bullet，保持其他条目不变。`;
  } else if (target.scope === "field") {
    scopeHint = `仅优化字段 "${target.field}"，保持其他字段不变。`;
  } else {
    scopeHint = "优化整个板块内容，保持 JSON 结构不变。";
  }

  return `你是简历写作助手。根据用户指令改写简历内容。
规则：
- 只输出 JSON，不要解释，不要 markdown 代码块。
- 输出结构必须与输入一致：${schema}
- ${scopeHint}
- 不要编造原文没有的经历或数据；可以优化表达、量化已有成果。
- 日期格式尽量保持 YYYY-MM。`;
}

function buildUserPrompt(
  target: EditTarget,
  content: unknown,
  instruction: string
): string {
  return `用户指令：${instruction}

当前内容（JSON）：
${JSON.stringify(content, null, 2)}

请返回改写后的完整 JSON（结构与输入一致）。`;
}

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

export async function editSectionContent(
  params: EditSectionParams
): Promise<EditSectionResult> {
  const { target, content, instruction, apiKey: userApiKey } = params;
  const original = structuredClone(content);

  const apiKey = resolveDeepseekApiKey(userApiKey);

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
          { role: "system", content: buildSystemPrompt(target) },
          {
            role: "user",
            content: buildUserPrompt(target, content, instruction),
          },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AIError("AI 编辑超时，请稍后重试", 504);
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

  let suggested: unknown;
  try {
    suggested = JSON.parse(stripCodeFence(raw));
  } catch {
    throw new AIError("AI 返回不是合法 JSON", 502);
  }

  return { original, suggested };
}
