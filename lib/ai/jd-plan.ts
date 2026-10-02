import { AIError, requestDeepseekJson } from "@/lib/ai/deepseek-client";
import type { ResumeContent } from "@/lib/resume/content";
import { createWorkspaceFingerprint } from "@/lib/resume/tailoring";
import type { EntrySectionId, SectionSubVersionsStore, StandardSectionId } from "@/lib/resume/versions";
import type { JdAdaptationPlan, JdCoverage, JdImportance, JdRecommendationAction, JdRequirement, ResumeEvidence } from "@/types/jd-tailoring";

const STANDARD_IDS: StandardSectionId[] = ["basic_info", "summary", "education", "skills"];
const ENTRY_IDS: EntrySectionId[] = ["work", "project"];

const SYSTEM_PROMPT = `你是中文简历岗位适配规划器。根据 JD 和简历素材输出可解释、可执行的 JSON。
规则：
- 提取 3～5 项岗位要求，每项包含 JD 原文。
- 工作/项目必须用 entryId、entryVersionId、bulletIndex 引用真实内容；普通板块用 versionId。
- 可建议 set_entry_enabled、switch_entry_version、rewrite_entry_bullet、switch_section_version、rewrite_education_bullet。
- 可以建议隐藏弱相关经历，也可启用相关的隐藏经历；优先复用已有版本。
- 不得编造事实或数字；coverage=missing 时不得改写。
- 只输出 JSON。
结构：{"requirements":[{"id":"r1","title":"","jdQuote":"","importance":"core|bonus","coverage":"covered|weak|missing"}],"evidence":[{"source":"entry|section","requirementId":"r1","sectionId":"work","entryId":"","entryVersionId":"","versionId":"","bulletIndex":0,"entryIndex":0,"text":"","reason":""}],"actions":[{"type":"set_entry_enabled|switch_entry_version|rewrite_entry_bullet|switch_section_version|rewrite_education_bullet","sectionId":"work","entryId":"","enabled":true,"fromVersionId":"","toVersionId":"","versionId":"","entryIndex":0,"bulletIndex":0,"original":"","suggested":"","reason":"","requirementIds":["r1"]}]}`;

type Row = Record<string, unknown>;
const row = (value: unknown): Row => value && typeof value === "object" ? value as Row : {};
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";
const index = (value: unknown): number | undefined => Number.isInteger(value) && (value as number) >= 0 ? value as number : undefined;
const importance = (value: unknown): JdImportance => value === "bonus" ? "bonus" : "core";
const coverage = (value: unknown): JdCoverage => value === "covered" || value === "missing" ? value : "weak";

function entryLabel(sectionId: EntrySectionId, facts: Row): string {
  return text(sectionId === "work" ? facts.company : facts.name) || (sectionId === "work" ? "未命名工作经历" : "未命名项目");
}

export function sanitizeJdAdaptationPlan(raw: unknown, context: { title: string; content: ResumeContent; versionStore: SectionSubVersionsStore; companyName: string; jobTitle: string }): JdAdaptationPlan {
  const root = row(raw);
  const aliases = new Map<string, string>();
  const requirements: JdRequirement[] = (Array.isArray(root.requirements) ? root.requirements : []).slice(0, 5).map((item, i) => {
    const value = row(item); const id = `req-${i + 1}`; aliases.set(text(value.id) || id, id);
    return { id, title: text(value.title) || `岗位要求 ${i + 1}`, jdQuote: text(value.jdQuote), importance: importance(value.importance), coverage: coverage(value.coverage) };
  }).filter((item) => item.jdQuote);
  if (!requirements.length) throw new AIError("未能提取有效岗位要求，请重试", 502);
  const byRequirement = new Map(requirements.map((item) => [item.id, item]));
  const reqId = (value: unknown) => { const resolved = aliases.get(text(value)) ?? text(value); return byRequirement.has(resolved) ? resolved : null; };
  const reqIds = (value: unknown) => (Array.isArray(value) ? value : []).map(reqId).filter((id): id is string => Boolean(id));

  const evidence: ResumeEvidence[] = [];
  for (const item of (Array.isArray(root.evidence) ? root.evidence : []).slice(0, 20)) {
    const value = row(item); const requirementId = reqId(value.requirementId); const sectionId = text(value.sectionId);
    if (!requirementId) continue;
    if (ENTRY_IDS.includes(sectionId as EntrySectionId)) {
      const id = sectionId as EntrySectionId; const entryId = text(value.entryId); const versionId = text(value.entryVersionId);
      const entry = context.versionStore.entrySections[id].entries[entryId]; const version = entry?.versions.find((v) => v.id === versionId); const bulletIndex = index(value.bulletIndex);
      const actual = bulletIndex === undefined ? null : version?.content.bullets[bulletIndex];
      if (!entry || !version || !actual) continue;
      evidence.push({ id: `evidence-${evidence.length + 1}`, source: "entry", requirementId, sectionId: id, entryId, entryVersionId: versionId, entryLabel: entryLabel(id, entry.facts as Row), versionName: version.name, bulletIndex: bulletIndex as number, text: actual, reason: text(value.reason) || "该经历与岗位要求相关。", isActive: entry.activeVersionId === versionId, isEnabled: entry.enabled });
      continue;
    }
    if (!STANDARD_IDS.includes(sectionId as StandardSectionId)) continue;
    const id = sectionId as StandardSectionId; const versionId = text(value.versionId); const version = context.versionStore.sections[id].versions.find((v) => v.id === versionId);
    if (!version) continue;
    const entryIndex = index(value.entryIndex); const bulletIndex = index(value.bulletIndex); let actual = text(value.text);
    if (id === "education" && entryIndex !== undefined && bulletIndex !== undefined) actual = (version.content as ResumeContent["education"]).entries[entryIndex]?.notes[bulletIndex] ?? "";
    else if (!JSON.stringify(version.content).includes(actual)) actual = "";
    if (!actual) continue;
    evidence.push({ id: `evidence-${evidence.length + 1}`, source: "section", requirementId, sectionId: id, versionId, versionName: version.name, entryIndex, bulletIndex, text: actual, reason: text(value.reason) || "该内容与岗位要求相关。", isActive: context.versionStore.sections[id].activeVersionId === versionId });
  }

  const actions: JdRecommendationAction[] = [];
  const switchedEntries = new Set<string>(); const switchedSections = new Set<string>();
  for (const item of (Array.isArray(root.actions) ? root.actions : []).slice(0, 20)) {
    const value = row(item); const type = text(value.type); const sectionId = text(value.sectionId); const requirementIds = reqIds(value.requirementIds); const reason = text(value.reason) || "该调整能提升岗位匹配度。";
    if (ENTRY_IDS.includes(sectionId as EntrySectionId)) {
      const id = sectionId as EntrySectionId; const entryId = text(value.entryId); const entry = context.versionStore.entrySections[id].entries[entryId]; if (!entry) continue;
      if (type === "set_entry_enabled" && typeof value.enabled === "boolean" && value.enabled !== entry.enabled) actions.push({ id: `action-${actions.length + 1}`, type, sectionId: id, entryId, enabled: value.enabled, reason, requirementIds });
      if (type === "switch_entry_version") { const fromVersionId = text(value.fromVersionId); const toVersionId = text(value.toVersionId); const key = `${id}:${entryId}`; if (!switchedEntries.has(key) && entry.versions.some((v) => v.id === fromVersionId) && entry.versions.some((v) => v.id === toVersionId)) { switchedEntries.add(key); actions.push({ id: `action-${actions.length + 1}`, type, sectionId: id, entryId, fromVersionId, toVersionId, reason, requirementIds }); } }
      if (type === "rewrite_entry_bullet" && !requirementIds.some((rid) => byRequirement.get(rid)?.coverage === "missing")) { const versionId = text(value.versionId); const version = entry.versions.find((v) => v.id === versionId); const bulletIndex = index(value.bulletIndex); const original = bulletIndex === undefined ? "" : version?.content.bullets[bulletIndex] ?? ""; const suggested = text(value.suggested); if (version && bulletIndex !== undefined && original && suggested && suggested !== original) actions.push({ id: `action-${actions.length + 1}`, type, sectionId: id, entryId, versionId, bulletIndex, original, suggested, reason, requirementIds }); }
      continue;
    }
    if (!STANDARD_IDS.includes(sectionId as StandardSectionId)) continue;
    const id = sectionId as StandardSectionId;
    if (type === "switch_section_version") { const fromVersionId = text(value.fromVersionId); const toVersionId = text(value.toVersionId); const bucket = context.versionStore.sections[id]; if (!switchedSections.has(id) && bucket.versions.some((v) => v.id === fromVersionId) && bucket.versions.some((v) => v.id === toVersionId)) { switchedSections.add(id); actions.push({ id: `action-${actions.length + 1}`, type, sectionId: id, fromVersionId, toVersionId, reason, requirementIds }); } }
    if (type === "rewrite_education_bullet" && id === "education" && !requirementIds.some((rid) => byRequirement.get(rid)?.coverage === "missing")) { const versionId = text(value.versionId); const version = context.versionStore.sections.education.versions.find((v) => v.id === versionId); const entryIndex = index(value.entryIndex); const bulletIndex = index(value.bulletIndex); if (!version || entryIndex === undefined || bulletIndex === undefined) continue; const original = version.content.entries[entryIndex]?.notes[bulletIndex] ?? ""; const suggested = text(value.suggested); if (original && suggested && original !== suggested) actions.push({ id: `action-${actions.length + 1}`, type, sectionId: "education", versionId, entryIndex, bulletIndex, original, suggested, reason, requirementIds }); }
  }
  return { sourceFingerprint: createWorkspaceFingerprint(context.title, context.content, context.versionStore), companyName: context.companyName.trim(), jobTitle: context.jobTitle.trim(), requirements, evidence, actions };
}

function compactStore(store: SectionSubVersionsStore): unknown {
  return {
    entrySections: ENTRY_IDS.map((sectionId) => ({ sectionId, entries: store.entrySections[sectionId].order.map((entryId) => { const entry = store.entrySections[sectionId].entries[entryId]; return { entryId, enabled: entry.enabled, facts: entry.facts, activeVersionId: entry.activeVersionId, versions: entry.versions.map((version) => ({ entryVersionId: version.id, versionName: version.name, content: version.content })) }; }) })),
    sections: STANDARD_IDS.map((sectionId) => ({ sectionId, activeVersionId: store.sections[sectionId].activeVersionId, versions: store.sections[sectionId].versions.map((version) => ({ versionId: version.id, versionName: version.name, content: version.content })) })),
  };
}

export async function generateJdAdaptationPlan(params: { title: string; content: ResumeContent; versionStore: SectionSubVersionsStore; companyName: string; jobTitle: string; jobDescription: string; apiKey?: string | null }): Promise<JdAdaptationPlan> {
  const raw = await requestDeepseekJson<unknown>({ apiKey: params.apiKey, systemPrompt: SYSTEM_PROMPT, userPrompt: `公司：${params.companyName.trim() || "未填写"}\n岗位：${params.jobTitle.trim()}\n\nJD：\n${params.jobDescription.trim().slice(0, 12000)}\n\n简历素材：\n${JSON.stringify(compactStore(params.versionStore), null, 2)}`, temperature: 0.2, errors: { timeout: "岗位分析超时，请稍后重试", connection: "无法连接 DeepSeek 服务", empty: "DeepSeek 未返回有效方案", invalidJson: "岗位适配结果不是合法 JSON" } });
  return sanitizeJdAdaptationPlan(raw, params);
}
