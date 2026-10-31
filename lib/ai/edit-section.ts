import { AIError, requestDeepseekJson } from "@/lib/ai/deepseek-client";
import type {
  AIEditAnswers,
  AIEditClarificationQuestion,
  AIEditResult,
  EditTarget,
} from "@/types/ai-edit";

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

type AdaptiveEditParams = EditSectionParams & {
  answers?: AIEditAnswers;
  conservative?: boolean;
};

const SECTION_SCHEMA_HINTS: Record<string, string> = {
  basic_info:
    '{ "name": "", "email": "", "phone": "", "location": "", "avatar": "", "target_cities": "", "desired_position": "", "website": "", "wechat": "", "linkedin": "", "github": "", "gender": "", "height": "", "weight": "", "ethnicity": "", "native_place": "", "political_status": "", "marital_status": "", "birthday": "" }',
  summary: '{ "text": "" }',
  work: '{ "entries": [{ "company": "", "title": "", "location": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM|present", "summary": "", "bullets": ["..."] }] }',
  education:
    '{ "entries": [{ "school": "", "schoolTag": "985|211|双一流|海外 QS Top|普通本科", "major": "", "degree": "高中|专科|本科|硕士|博士", "studyType": "全日制|非全日制|在职|交换", "college": "", "city": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM|present", "gpa": "", "notes": ["..."] }] }',
  project:
    '{ "entries": [{ "name": "", "role": "", "startDate": "", "endDate": "", "techStack": [""], "link": "", "summary": "", "bullets": ["..."] }] }',
  skills: '{ "categories": [{ "label": "", "items": ["..."] }] }',
};

const EDIT_ERRORS = {
  timeout: "AI 编辑超时，请稍后重试",
  connection: "无法连接 DeepSeek 服务",
  empty: "DeepSeek 未返回有效内容",
  invalidJson: "AI 返回不是合法 JSON",
} as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function trimStrings(values: unknown[], limit: number): string[] {
  return values
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, limit);
}

function hasCompatibleTopLevelStructure(
  original: unknown,
  suggested: unknown
): boolean {
  if (Array.isArray(original)) return Array.isArray(suggested);
  if (original === null || suggested === null) {
    return original === null && suggested === null;
  }
  if (typeof original !== "object" || typeof suggested !== "object") {
    return typeof original === typeof suggested;
  }
  if (Array.isArray(suggested)) return false;

  const originalKeys = Object.keys(original as Record<string, unknown>);
  const suggestedKeys = new Set(
    Object.keys(suggested as Record<string, unknown>)
  );
  return originalKeys.every((key) => suggestedKeys.has(key));
}

function buildScopeHint(target: EditTarget): string {
  if (target.scope === "bullet") {
    const entryPosition = "entryIndex" in target ? target.entryIndex + 1 : 1;
    return `仅优化第 ${entryPosition} 条经历中的第 ${target.bulletIndex + 1} 条 bullet，保持其他条目不变。`;
  }
  if (target.scope === "field") {
    return `仅优化字段 "${target.field}"，保持其他字段不变。`;
  }
  return "优化整个板块内容，保持 JSON 结构不变。";
}

function buildSystemPrompt(target: EditTarget): string {
  const schema = SECTION_SCHEMA_HINTS[target.sectionId] ?? "与输入相同结构";
  return `你是资深中文简历写作助手。根据用户指令改写简历内容，输出必须明显优于原文。
规则：
- 只输出 JSON，不要解释，不要 markdown 代码块。
- 输出结构必须与输入一致：${schema}
- ${buildScopeHint(target)}
- 必须做实质性改写：精炼冗长句、强化动作与成果、理顺逻辑与重点；可读性应明显提升。
- 禁止只改空格、标点、全半角或同义微替换却语义几乎不变；若无法改进，仍须重写句子结构与用词，不能原样返回。
- 不要编造原文没有的公司、职位、项目、技能或数字；可将已有成果写得更清晰，但不得虚构量化指标。
- 保留关键事实与专有名词（如公司名、产品名、技术名），中英文混排时用自然空格即可。
- 日期格式尽量保持 YYYY-MM。`;
}

function buildAdaptiveSystemPrompt(
  target: EditTarget,
  followUp: boolean
): string {
  const schema = SECTION_SCHEMA_HINTS[target.sectionId] ?? "与输入相同结构";
  const decisionRules = followUp
    ? `- 这是补充信息后的请求，必须返回 status="ready"，不得再追问。
- 若用户未补充信息，只能基于原文事实做保守重组，不得暗示缺失结果。`
    : `- 首次请求可返回 status="ready" 或 status="needs_input"。
- 仅当缺少会显著影响真实性或改写价值的关键事实时返回 needs_input。
- 信息足够时直接返回 ready，不要为了润色而追问。`;

  return `你是资深中文简历写作助手。目标是提高信息密度和可验证性，而不是普通润色。
规则：
- 只输出 JSON，不要解释，不要 markdown 代码块。
- ${buildScopeHint(target)}
- 结构提示：${schema}
- 使用清晰的行动、对象、方法和结果组织表达。
- 保留公司名、项目名、技术名、时间和已有数字。
- 不得新增原文或用户回答中不存在的事实、数字与因果关系。
- 禁止只改标点、空格、语序或近义词。
- 避免“负责、参与、协助、显著提升”等缺少具体对象的套话。
${decisionRules}
- ready 结构：{"status":"ready","suggested":<与原文同结构的 JSON>,"improvements":["具体改进点"]}
- needs_input 结构：{"status":"needs_input","diagnosis":"一句诊断","questions":[{"question":"具体问题","placeholder":"可选示例"}]}
- improvements 与 questions 最多各 3 条。`;
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

function buildAdaptiveUserPrompt(
  content: unknown,
  instruction: string,
  options: { answers?: AIEditAnswers; conservative?: boolean }
): string {
  const parts = [
    `用户指令：${enrichInstruction(instruction)}`,
    "",
    "当前内容（JSON）：",
    JSON.stringify(content, null, 2),
  ];

  if (options.conservative) {
    parts.push(
      "",
      "用户选择暂不补充信息。请仅基于原文已有事实做保守优化，不得编造结果或数字。"
    );
  } else if (options.answers && Object.keys(options.answers).length > 0) {
    parts.push(
      "",
      "用户补充事实：",
      JSON.stringify(options.answers, null, 2),
      "请把补充事实融入改写，但仍不得新增回答之外的事实或数字。"
    );
  } else {
    parts.push(
      "",
      "请判断：若信息足够，直接返回 ready；若关键事实不足，返回 needs_input。"
    );
  }

  return parts.join("\n");
}

export function sanitizeAdaptiveEditResult(
  raw: unknown,
  original: unknown,
  followUp: boolean
): AIEditResult {
  const root = asRecord(raw);
  if (!root) {
    throw new AIError("AI 返回格式无效", 502);
  }

  const status = root.status;
  if (status === "needs_input") {
    if (followUp) {
      throw new AIError("补充信息后仍未生成有效建议", 502);
    }
    const diagnosis =
      typeof root.diagnosis === "string" && root.diagnosis.trim()
        ? root.diagnosis.trim()
        : "当前内容缺少支撑高质量改写的关键事实。";
    const questionsRaw = Array.isArray(root.questions) ? root.questions : [];
    const questions: AIEditClarificationQuestion[] = [];
    for (const item of questionsRaw) {
      const row = asRecord(item);
      const question =
        typeof row?.question === "string" ? row.question.trim() : "";
      if (!question) continue;
      const placeholder =
        typeof row?.placeholder === "string" && row.placeholder.trim()
          ? row.placeholder.trim()
          : undefined;
      questions.push({
        id: `question-${questions.length + 1}`,
        question,
        ...(placeholder ? { placeholder } : {}),
      });
      if (questions.length >= 3) break;
    }
    if (!questions.length) {
      throw new AIError("AI 未返回有效追问", 502);
    }
    return { status: "needs_input", original, diagnosis, questions };
  }

  if (status !== "ready") {
    throw new AIError("AI 返回状态无效", 502);
  }

  if (root.suggested === undefined) {
    throw new AIError("AI 未返回有效建议", 502);
  }
  if (!hasCompatibleTopLevelStructure(original, root.suggested)) {
    throw new AIError("AI 建议结构与原文不兼容", 502);
  }
  if (JSON.stringify(root.suggested) === JSON.stringify(original)) {
    throw new AIError("AI 建议与原文没有实质差异", 502);
  }

  const improvements = trimStrings(
    Array.isArray(root.improvements) ? root.improvements : [],
    3
  );
  return {
    status: "ready",
    original,
    suggested: root.suggested,
    improvements:
      improvements.length > 0 ? improvements : ["重组表达，提高信息密度"],
  };
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
    errors: EDIT_ERRORS,
  });

  return { original, suggested };
}

export async function editSectionContentAdaptive(
  params: AdaptiveEditParams
): Promise<AIEditResult> {
  const {
    target,
    content,
    instruction,
    apiKey: userApiKey,
    answers,
    conservative = false,
  } = params;
  const original = structuredClone(content);
  const cleanedAnswers = Object.fromEntries(
    Object.entries(answers ?? {})
      .map(([id, value]) => [id, value.trim()] as const)
      .filter(([, value]) => value.length > 0)
      .slice(0, 3)
  );
  const followUp = conservative || Object.keys(cleanedAnswers).length > 0;
  const raw = await requestDeepseekJson<unknown>({
    apiKey: userApiKey,
    systemPrompt: buildAdaptiveSystemPrompt(target, followUp),
    userPrompt: buildAdaptiveUserPrompt(content, instruction, {
      answers: cleanedAnswers,
      conservative,
    }),
    temperature: followUp ? 0.5 : 0.4,
    errors: EDIT_ERRORS,
  });

  return sanitizeAdaptiveEditResult(raw, original, followUp);
}
