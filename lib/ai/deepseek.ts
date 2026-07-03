import {
  normalizeResumeContent,
  type ResumeContent,
} from "@/lib/resume/content";

export class AIError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "AIError";
    this.status = status;
  }
}

const SYSTEM_PROMPT = `你是一个简历解析引擎。用户会给你一段从 PDF/DOCX 中提取的简历纯文本（可能格式混乱、顺序错乱）。
请把它解析为严格的 JSON，结构如下（所有字段必须存在，缺失信息用空字符串或空数组）：

{
  "title": "简历标题，如 '张三·产品经理'，根据姓名与最近职位推断",
  "content": {
    "basic_info": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "website": "" },
    "summary": { "text": "个人简介/自我评价，没有则空字符串" },
    "work": { "entries": [ { "company": "", "title": "", "location": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM 或 present", "bullets": ["职责或成就，每条一句"] } ] },
    "education": { "entries": [ { "school": "", "degree": "", "major": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM 或 present", "gpa": "", "notes": ["荣誉/课程"] } ] },
    "project": { "entries": [ { "name": "", "role": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "techStack": ["技术名"], "link": "", "bullets": ["项目描述"] } ] },
    "skills": { "categories": [ { "label": "分类名，如 编程语言", "items": ["技能项"] } ] }
  }
}

规则：
- 只输出 JSON，不要任何解释、不要 markdown 代码块。
- 日期尽量规范为 YYYY-MM；无法判断的保持原文或留空。
- 不要编造原文没有的信息。
- bullets / items 拆分为独立条目，去掉项目符号前缀。`;

interface ParseResult {
  title: string;
  content: ResumeContent;
}

/**
 * Send extracted resume text to DeepSeek and get back structured content.
 * Throws AIError when the key is missing or the response is invalid.
 */
export async function parseResumeText(text: string): Promise<ParseResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new AIError(
      "未配置 DEEPSEEK_API_KEY，请在 .env.local 中填入后重启服务",
      503
    );
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
            content: `以下是简历原始文本：\n\n${text.slice(0, 20000)}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AIError("解析超时，请稍后重试", 504);
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

  let parsed: { title?: string; content?: Partial<ResumeContent> };
  try {
    parsed = JSON.parse(stripCodeFence(raw));
  } catch {
    throw new AIError("解析结果不是合法 JSON", 502);
  }

  const content = normalizeResumeContent(parsed.content ?? (parsed as Partial<ResumeContent>));
  const title =
    (parsed.title && parsed.title.trim()) ||
    content.basic_info.name.trim() ||
    "导入的简历";

  return { title, content };
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
