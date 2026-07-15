"use client";

interface AIOriginalPanelProps {
  text: string;
  compact?: boolean;
}

export function AIOriginalPanel({ text, compact = false }: AIOriginalPanelProps) {
  const empty = !text.trim();

  return (
    <div className={compact ? "mb-3" : "mb-4"}>
      <p className="mb-1.5 text-[11px] font-medium text-ink-soft">当前内容</p>
      <pre
        className={`overflow-auto whitespace-pre-wrap rounded-xl border border-ink-soft/10 bg-fog-soft/30 p-3 text-[12px] leading-relaxed text-ink ${
          compact ? "max-h-32" : "max-h-40"
        }`}
      >
        {empty ? "（暂无内容）" : text}
      </pre>
    </div>
  );
}
