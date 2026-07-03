"use client";

import clsx from "clsx";
import type { EditTarget } from "@/types/ai-edit";

function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

/** Simple line-level diff for text or JSON display. */
function diffLines(original: string, suggested: string): {
  type: "same" | "removed" | "added";
  text: string;
}[] {
  const origLines = original.split("\n");
  const suggLines = suggested.split("\n");
  const result: { type: "same" | "removed" | "added"; text: string }[] = [];

  const maxLen = Math.max(origLines.length, suggLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i];
    const s = suggLines[i];
    if (o === s) {
      if (o !== undefined) result.push({ type: "same", text: o });
    } else {
      if (o !== undefined) result.push({ type: "removed", text: o });
      if (s !== undefined) result.push({ type: "added", text: s });
    }
  }
  return result;
}

interface AIDiffViewProps {
  target: EditTarget;
  original: unknown;
  suggested: unknown;
  onAccept: () => void;
  onReject: () => void;
  loading?: boolean;
}

export function AIDiffView({
  target,
  original,
  suggested,
  onAccept,
  onReject,
  loading,
}: AIDiffViewProps) {
  const origText = formatValue(extractDisplayValue(target, original));
  const suggText = formatValue(extractDisplayValue(target, suggested));
  const lines = diffLines(origText, suggText);

  return (
    <div className="rounded-lg border border-accent-ai/25 bg-accent-ai/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-medium text-accent-ai">AI 改写建议</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReject}
            disabled={loading}
            className="rounded-md px-2.5 py-1 text-[12px] text-ink-soft transition-colors hover:bg-white hover:text-ink disabled:opacity-50"
          >
            放弃
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={loading}
            className="rounded-md bg-brand px-2.5 py-1 text-[12px] font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            采纳
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-muted">
            原文
          </p>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-ink-soft/10 bg-white p-2 text-[12px] leading-relaxed text-ink">
            {origText}
          </pre>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-muted">
            建议
          </p>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-brand/20 bg-brand-soft/30 p-2 text-[12px] leading-relaxed text-ink">
            {suggText}
          </pre>
        </div>
      </div>

      {lines.some((l) => l.type !== "same") && (
        <div className="mt-2 rounded-md border border-ink-soft/10 bg-white p-2">
          <p className="mb-1 text-[10px] font-medium text-ink-muted">变更摘要</p>
          <div className="space-y-0.5 font-mono text-[11px]">
            {lines.map((line, i) => (
              <div
                key={i}
                className={clsx(
                  "rounded px-1",
                  line.type === "removed" && "bg-red-50 text-red-700 line-through",
                  line.type === "added" && "bg-green-50 text-green-800"
                )}
              >
                {line.type === "removed" ? "− " : line.type === "added" ? "+ " : "  "}
                {line.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function extractDisplayValue(target: EditTarget, value: unknown): unknown {
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
  return value;
}
