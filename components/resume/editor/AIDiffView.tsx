"use client";

import clsx from "clsx";
import type { EditTarget } from "@/types/ai-edit";
import { formatAIEditDisplayValue } from "@/lib/ai/display-value";

/** Simple line-level diff for text display. */
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
  variant?: "inline" | "modal";
}

export function AIDiffView({
  target,
  original,
  suggested,
  onAccept,
  onReject,
  loading,
  variant = "inline",
}: AIDiffViewProps) {
  const origText = formatAIEditDisplayValue(target, original);
  const suggText = formatAIEditDisplayValue(target, suggested);
  const lines = diffLines(origText, suggText);
  const isModal = variant === "modal";
  const unchanged = origText.trim() === suggText.trim();

  return (
    <div
      className={
        isModal
          ? "p-0"
          : "rounded-2xl border border-accent-ai/25 bg-accent-ai/[0.06] p-4"
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[12px] font-medium text-accent-ai">AI 参考建议</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onReject}
            disabled={loading}
            className="rounded-full border border-ink-soft/15 bg-white px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:border-ink-soft/25 hover:text-ink disabled:opacity-50"
          >
            不采纳，保留原文
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={loading || unchanged}
            className="rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#1A2D40] disabled:opacity-50"
          >
            采纳建议
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-muted">
            原文
          </p>
          <pre
            className={`overflow-auto whitespace-pre-wrap rounded-xl border border-ink-soft/10 bg-fog-soft/30 p-3 text-[12px] leading-relaxed text-ink ${
              isModal ? "max-h-52" : "max-h-40"
            }`}
          >
            {origText || "（暂无内容）"}
          </pre>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-muted">
            AI 建议
          </p>
          <pre
            className={`overflow-auto whitespace-pre-wrap rounded-xl border border-accent-green/25 bg-accent-green/10 p-3 text-[12px] leading-relaxed text-ink ${
              isModal ? "max-h-52" : "max-h-40"
            }`}
          >
            {suggText || "（无建议）"}
          </pre>
        </div>
      </div>

      {lines.some((l) => l.type !== "same") && (
        <div className="mt-3 rounded-xl border border-ink-soft/10 bg-white p-3">
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

      {unchanged && (
        <p className="mt-3 text-[11px] text-ink-muted">
          AI 建议与原文相同，无需采纳。
        </p>
      )}
    </div>
  );
}
