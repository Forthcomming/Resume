import { AIError, requestDeepseekJson } from "@/lib/ai/deepseek-client";
import type { ResumeContent } from "@/lib/resume/content";
import { createWorkspaceFingerprint } from "@/lib/resume/tailoring";
import {
  SECTION_IDS,
  type SectionId,
  type SectionSubVersion,
  type SectionSubVersionsStore,
} from "@/lib/resume/versions";
import type {
  JdAdaptationPlan,
  JdCoverage,
  JdImportance,
  JdRecommendationAction,
  JdRequirement,
  ResumeEvidence,
} from "@/types/jd-tailoring";

const SYSTEM_PROMPT = `你是中文简历岗位适配规划器。请根据岗位 JD 和用户全部简历板块版本，输出一份可解释、可执行的 JSON 方案。

规则：
- 提取 3～5 项岗位要求，每项必须包含 JD 原文片段。
- evidence 只能引用输入中真实存在的 sectionId、versionId、entryIndex、bulletIndex 和原文。
- targetVersionBySection 中每个板块最多选择一个版本，形成全局一致组合。
- 优先复用已有版本；只有已有版本相关但表达不足时才生成 rewrite_bullet。
- rewrite_bullet 仅允许 work、project、education 中已有的 bullet/notes。
- 不得编造公司、职位、项目、工具、职责、结果或数字。
- coverage=missing 时不得生成 rewrite_bullet。
- 只输出 JSON，不要解释或 markdown。

输出结构：
{
  "requirements": [{ "id": "r1", "title": "", "jdQuote": "", "importance": "core|bonus", "coverage": "covered|weak|missing" }],
  "evidence": [{ "requirementId": "r1", "sectionId": "work", "versionId": "", "entryIndex": 0, "bulletIndex": 0, "text": "输入中的原文", "reason": "" }],
  "targetVersionBySection": { "work": "version-id" },
  "actions": [
    { "type": "keep", "sectionId": "summary", "versionId": "", "reason": "" },
    { "type": "switch_version", "sectionId": "work", "fromVersionId": "", "toVersionId": "", "reason": "", "requirementIds": ["r1"] },
    { "type": "rewrite_bullet", "sectionId": "work", "versionId": "", "entryIndex": 0, "bulletIndex": 0, "original": "", "suggested": "", "reason": "", "requirementIds": ["r1"] }
  ]
}`;

type RawRow = Record<string, unknown>;

function asRow(value: unknown): RawRow {
  return value && typeof value === "object" ? (value as RawRow) : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asIndex(value: unknown): number | undefined {
  return Number.isInteger(value) && (value as number) >= 0
    ? (value as number)
    : undefined;
}

function asSectionId(value: unknown): SectionId | null {
  return typeof value === "string" && (SECTION_IDS as string[]).includes(value)
    ? (value as SectionId)
    : null;
}

function asImportance(value: unknown): JdImportance {
  return value === "bonus" ? "bonus" : "core";
}

function asCoverage(value: unknown): JdCoverage {
  return value === "covered" || value === "missing" ? value : "weak";
}

function versionFor<K extends SectionId>(
  store: SectionSubVersionsStore,
  sectionId: K,
  versionId: string
) : SectionSubVersion<ResumeContent[K]> | undefined {
  return store.sections[sectionId].versions.find(
    (version) => version.id === versionId
  ) as SectionSubVersion<ResumeContent[K]> | undefined;
}

function referencedBullet(
  store: SectionSubVersionsStore,
  sectionId: "work" | "project" | "education",
  versionId: string,
  entryIndex: number,
  bulletIndex: number
): string | null {
  const version = versionFor(store, sectionId, versionId);
  if (!version) return null;
  const entry = version.content.entries[entryIndex];
  if (!entry) return null;
  const bullets = "bullets" in entry ? entry.bullets : entry.notes;
  return bullets[bulletIndex] ?? null;
}

export function sanitizeJdAdaptationPlan(
  raw: unknown,
  context: {
    title: string;
    content: ResumeContent;
    versionStore: SectionSubVersionsStore;
    companyName: string;
    jobTitle: string;
  }
): JdAdaptationPlan {
  const root = asRow(raw);
  const requirementIdMap = new Map<string, string>();
  const requirements: JdRequirement[] = (Array.isArray(root.requirements)
    ? root.requirements
    : []
  )
    .slice(0, 5)
    .map((item, index) => {
      const row = asRow(item);
      const id = `req-${index + 1}`;
      requirementIdMap.set(asString(row.id) || id, id);
      return {
        id,
        title: asString(row.title) || `岗位要求 ${index + 1}`,
        jdQuote: asString(row.jdQuote),
        importance: asImportance(row.importance),
        coverage: asCoverage(row.coverage),
      };
    })
    .filter((item) => item.jdQuote.length > 0);

  if (requirements.length === 0) {
    throw new AIError("未能提取有效岗位要求，请重试", 502);
  }

  const requirementById = new Map(
    requirements.map((requirement) => [requirement.id, requirement])
  );
  const resolveRequirementId = (value: unknown): string | null => {
    const rawId = asString(value);
    const id = requirementIdMap.get(rawId) ?? rawId;
    return requirementById.has(id) ? id : null;
  };

  const evidence: ResumeEvidence[] = [];
  for (const item of (Array.isArray(root.evidence) ? root.evidence : []).slice(
    0,
    15
  )) {
    const row = asRow(item);
    const requirementId = resolveRequirementId(row.requirementId);
    const sectionId = asSectionId(row.sectionId);
    const versionId = asString(row.versionId);
    if (!requirementId || !sectionId || !versionId) continue;
    const version = versionFor(context.versionStore, sectionId, versionId);
    if (!version) continue;
    const entryIndex = asIndex(row.entryIndex);
    const bulletIndex = asIndex(row.bulletIndex);
    let text = asString(row.text);
    if (
      (sectionId === "work" ||
        sectionId === "project" ||
        sectionId === "education") &&
      entryIndex !== undefined &&
      bulletIndex !== undefined
    ) {
      const actual = referencedBullet(
        context.versionStore,
        sectionId,
        versionId,
        entryIndex,
        bulletIndex
      );
      if (!actual) continue;
      text = actual;
    } else if (!JSON.stringify(version.content).includes(text)) {
      continue;
    }
    evidence.push({
      id: `evidence-${evidence.length + 1}`,
      requirementId,
      sectionId,
      versionId,
      versionName: version.name,
      entryIndex,
      bulletIndex,
      text,
      reason: asString(row.reason) || "该经历与岗位要求相关。",
      isActive: context.versionStore.sections[sectionId].activeVersionId === versionId,
    });
  }

  const targetVersionBySection: Partial<Record<SectionId, string>> = {};
  const rawTargets = asRow(root.targetVersionBySection);
  for (const sectionId of SECTION_IDS) {
    const versionId = asString(rawTargets[sectionId]);
    if (versionId && versionFor(context.versionStore, sectionId, versionId)) {
      targetVersionBySection[sectionId] = versionId;
    }
  }

  const actions: JdRecommendationAction[] = [];
  const switchedSections = new Set<SectionId>();
  for (const item of (Array.isArray(root.actions) ? root.actions : []).slice(
    0,
    12
  )) {
    const row = asRow(item);
    const sectionId = asSectionId(row.sectionId);
    const type = asString(row.type);
    if (!sectionId) continue;

    if (type === "keep") {
      const versionId = asString(row.versionId);
      if (!versionFor(context.versionStore, sectionId, versionId)) continue;
      actions.push({
        id: `action-${actions.length + 1}`,
        type: "keep",
        sectionId,
        versionId,
        reason: asString(row.reason) || "当前版本已经匹配岗位要求。",
      });
      continue;
    }

    const requirementIds = (Array.isArray(row.requirementIds)
      ? row.requirementIds
      : []
    )
      .map(resolveRequirementId)
      .filter((id): id is string => Boolean(id));

    if (type === "switch_version") {
      const fromVersionId = asString(row.fromVersionId);
      const toVersionId = asString(row.toVersionId);
      if (
        switchedSections.has(sectionId) ||
        !versionFor(context.versionStore, sectionId, fromVersionId) ||
        !versionFor(context.versionStore, sectionId, toVersionId) ||
        (targetVersionBySection[sectionId] &&
          targetVersionBySection[sectionId] !== toVersionId)
      ) {
        continue;
      }
      targetVersionBySection[sectionId] = toVersionId;
      switchedSections.add(sectionId);
      actions.push({
        id: `action-${actions.length + 1}`,
        type: "switch_version",
        sectionId,
        fromVersionId,
        toVersionId,
        reason: asString(row.reason) || "该版本更匹配岗位要求。",
        requirementIds,
      });
      continue;
    }

    if (
      type !== "rewrite_bullet" ||
      (sectionId !== "work" &&
        sectionId !== "project" &&
        sectionId !== "education") ||
      requirementIds.some(
        (id) => requirementById.get(id)?.coverage === "missing"
      )
    ) {
      continue;
    }
    const versionId = asString(row.versionId);
    const entryIndex = asIndex(row.entryIndex);
    const bulletIndex = asIndex(row.bulletIndex);
    if (entryIndex === undefined || bulletIndex === undefined) continue;
    const actual = referencedBullet(
      context.versionStore,
      sectionId,
      versionId,
      entryIndex,
      bulletIndex
    );
    const suggested = asString(row.suggested);
    if (!actual || !suggested || suggested === actual) continue;
    actions.push({
      id: `action-${actions.length + 1}`,
      type: "rewrite_bullet",
      sectionId,
      versionId,
      entryIndex,
      bulletIndex,
      original: actual,
      suggested,
      reason: asString(row.reason) || "强化与岗位要求相关的表达。",
      requirementIds,
    });
  }

  return {
    sourceFingerprint: createWorkspaceFingerprint(
      context.title,
      context.content,
      context.versionStore
    ),
    companyName: context.companyName.trim(),
    jobTitle: context.jobTitle.trim(),
    requirements,
    evidence,
    targetVersionBySection,
    actions,
  };
}

function compactVersionStore(store: SectionSubVersionsStore): unknown {
  return SECTION_IDS.map((sectionId) => ({
    sectionId,
    activeVersionId: store.sections[sectionId].activeVersionId,
    versions: store.sections[sectionId].versions.map((version) => ({
      versionId: version.id,
      versionName: version.name,
      content: version.content,
    })),
  }));
}

export async function generateJdAdaptationPlan(params: {
  title: string;
  content: ResumeContent;
  versionStore: SectionSubVersionsStore;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  apiKey?: string | null;
}): Promise<JdAdaptationPlan> {
  const raw = await requestDeepseekJson<unknown>({
    apiKey: params.apiKey,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `公司：${params.companyName.trim() || "未填写"}\n岗位：${params.jobTitle.trim()}\n\nJD：\n${params.jobDescription.trim().slice(0, 12000)}\n\n简历全部版本：\n${JSON.stringify(compactVersionStore(params.versionStore), null, 2)}`,
    temperature: 0.2,
    errors: {
      timeout: "岗位分析超时，请稍后重试",
      connection: "无法连接 DeepSeek 服务",
      empty: "DeepSeek 未返回有效方案",
      invalidJson: "岗位适配结果不是合法 JSON",
    },
  });
  return sanitizeJdAdaptationPlan(raw, params);
}
