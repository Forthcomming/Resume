import type { EditTarget } from "@/types/ai-edit";

/** Extract human-readable content from an AI edit slice for display. */
export function extractAIEditDisplayValue(
  target: EditTarget,
  value: unknown
): unknown {
  if (target.scope === "bullet" && value && typeof value === "object") {
    const entries = (value as { entries?: unknown[] }).entries;
    const entry = entries?.[target.entryIndex] as
      | { bullets?: string[]; notes?: string[] }
      | undefined;
    if (entry) {
      const list = entry.bullets ?? entry.notes ?? [];
      return list[target.bulletIndex] ?? "";
    }
  }
  if (target.scope === "field" && value && typeof value === "object") {
    return (value as Record<string, string>)[target.field] ?? "";
  }
  if (target.scope === "section" && target.sectionId === "summary") {
    if (value && typeof value === "object") {
      return (value as { text?: string }).text ?? "";
    }
  }
  return value;
}

export function formatAIEditDisplayValue(
  target: EditTarget,
  value: unknown
): string {
  const extracted = extractAIEditDisplayValue(target, value);
  if (typeof extracted === "string") return extracted;
  if (extracted == null) return "";
  return JSON.stringify(extracted, null, 2);
}
