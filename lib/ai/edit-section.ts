import { requestDeepseekJson } from "@/lib/ai/deepseek-client";
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
  const schema = SECTION_SCHEMA_HINTS[target.sectionId] ?? "与输入相同结构";

  let scopeHint = "";
  if (target.scope === "bullet") {
    const entryPosition = "entryIndex" in target ? target.entryIndex + 1 : 1;
    scopeHint = `仅优化第 ${entryPosition} 条经历中的第 ${target.bulletIndex + 1} 条 bullet，保持其他条目不变。`;
  } else if (target.scope === "field") {
    scopeHint = `仅优化字段 "${target.field}"，保持其他字段不变。`;
  } else {
    scopeHint = "优化整个板块内容，保持 JSON 结构不变。";
  }

  return `你是资深中文简历写作助手。根据用户指令改写简历内容，输出必须明显优于原文。
规则：
- 只输出 JSON，不要解释，不要 markdown 代码块。
- 输出结构必须与输入一致：${schema}
- ${scopeHint}
- 必须做实质性改写：精炼冗长句、强化动作与成果、理顺逻辑与重点；可读性应明显提升。
- 禁止只改空格、标点、全半角或同义微替换却语义几乎不变；若无法改进，仍须重写句子结构与用词，不能原样返回。
- 不要编造原文没有的公司、职位、项目、技能或数字；可将已有成果写得更清晰，但不得虚构量化指标。
- 保留关键事实与专有名词（如公司名、产品名、技术名），中英文混排时用自然空格即可。
- 日期格式尽量保持 YYYY-MM。`;
}

function enrichInstruction(instruction: string): string {
  const trimmed = instruction.trim();
  const vague =
    trimmed.length < 10 ||
    /^(优化|改一下|帮我改|润色|改进|重写|polish)(一下|下|这段|这段话|这段内容)?[!！.。]*$/i.test(
      trimmed
    );
  if (!vague) return trimmed;
  return `${trimmed}
补充要求：请做实质性改写——精炼表达、突出成果与职责重点、理顺逻辑；禁止只删空格/改标点；不得编造原文没有的经历或数据。`;
}

function buildUserPrompt(
  target: EditTarget,
  content: unknown,
  instruction: string
): string {
  return `用户指令：${enrichInstruction(instruction)}

当前内容（JSON）：
${JSON.stringify(content, null, 2)}

请返回改写后的完整 JSON（结构与输入一致；相对原文须有实质差异）。`;
}

export async function editSectionContent(
  params: EditSectionParams
): Promise<EditSectionResult> {
  const { target, content, instruction, apiKey: userApiKey } = params;
  const original = structuredClone(content);
  const suggested = await requestDeepseekJson<unknown>({
    apiKey: userApiKey,
    systemPrompt: buildSystemPrompt(target),
    userPrompt: buildUserPrompt(target, content, instruction),
    temperature: 0.7,
    errors: {
      timeout: "AI 编辑超时，请稍后重试",
      connection: "无法连接 DeepSeek 服务",
      empty: "DeepSeek 未返回有效内容",
      invalidJson: "AI 返回不是合法 JSON",
    },
  });

  return { original, suggested };
}
