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
    return {
      title: `AI 优化 · ${label} 第 ${target.entryIndex + 1} 条`,
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
    return "输入改写指令，如：量化数据、突出成果";
  }
  if (target.scope === "bullet") {
    return "优化此条描述，如：加入量化数据、突出业务影响";
  }
  return `优化「${sectionTitle}」，如：改得更有数据感、更贴合产品岗`;
}
