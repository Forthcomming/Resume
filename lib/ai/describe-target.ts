import type { EditTarget } from "@/types/ai-edit";

const BULLET_SECTION_LABELS: Record<string, string> = {
  work: "工作经历",
  education: "教育经历",
  project: "项目经历",
};

export function describeAIEditTarget(
  target: EditTarget,
  sectionTitle: string
): { title: string; subtitle?: string } {
  if (target.scope === "section") {
    return { title: `AI 优化 · ${sectionTitle}` };
  }
  if (target.scope === "bullet") {
    const label = BULLET_SECTION_LABELS[target.sectionId] ?? sectionTitle;
    const entryLabel = "entryIndex" in target
      ? ` 第 ${target.entryIndex + 1} 条`
      : "";
    return {
      title: `AI 优化 · ${label}${entryLabel}`,
      subtitle: `要点 ${target.bulletIndex + 1}`,
    };
  }
  if (target.scope === "field") {
    return { title: `AI 优化 · ${sectionTitle}` };
  }
  return { title: "AI 优化" };
}

export function aiPromptPlaceholder(
  target: EditTarget | null,
  sectionTitle: string
): string {
  if (!target) {
    return "例如：精炼到 3 句、突出数据成果、更像产品岗表述";
  }
  if (target.scope === "bullet") {
    return "例如：用成果导向重写、补上可量化影响、删掉空话";
  }
  return `例如：精炼「${sectionTitle}」、突出核心能力与成果、更贴目标岗位`;
}
