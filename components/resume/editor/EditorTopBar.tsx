"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, FileText, Check, Download, Loader2, Pencil } from "lucide-react";

export type SaveState = "saving" | "saved";

export function EditorTopBar({
  title,
  saveState = "saved",
  onTitleChange,
  onExportPdf,
}: {
  title: string;
  saveState?: SaveState;
  onTitleChange?: (title: string) => void;
  onExportPdf?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitTitle = () => {
    const next = draft.trim() || "未命名简历";
    setDraft(next);
    onTitleChange?.(next);
    setEditing(false);
  };

  return (
    <header className="no-print flex h-14 shrink-0 items-center gap-3 border-b border-white/60 bg-white/75 px-5 shadow-[0_1px_0_rgba(15,25,36,0.04)] backdrop-blur-md">
      <Link
        href="/dashboard"
        aria-label="返回"
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-fog-soft hover:text-ink"
      >
        <ChevronLeft size={18} strokeWidth={2} />
      </Link>

      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-ink text-white shadow-sm">
        <FileText size={13} strokeWidth={2.5} />
      </span>

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitTitle();
            if (e.key === "Escape") {
              setDraft(title);
              setEditing(false);
            }
          }}
          className="h-8 min-w-0 max-w-[280px] flex-1 rounded-full border border-ink-soft/15 bg-white px-3 text-[15px] font-medium tracking-tight text-ink outline-none focus:border-ink-soft/25 focus:ring-2 focus:ring-ink/5"
          aria-label="简历标题"
        />
      ) : (
        <button
          type="button"
          onClick={() => onTitleChange && setEditing(true)}
          className="group flex min-w-0 max-w-[280px] items-center gap-1.5 rounded-full px-1 py-0.5 text-left transition-colors hover:bg-fog-soft/60"
          title={onTitleChange ? "点击修改简历标题" : undefined}
        >
          <span className="truncate text-[15px] font-medium tracking-tight text-ink">
            {title}
          </span>
          {onTitleChange ? (
            <Pencil
              size={13}
              strokeWidth={2}
              className="shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
            />
          ) : null}
        </button>
      )}

      <span className="ml-1 flex items-center gap-1.5 rounded-full bg-fog-soft/80 px-2.5 py-1 text-[11px] text-ink-muted">
        {saveState === "saving" ? (
          <>
            <Loader2 size={12} strokeWidth={2} className="animate-spin" />
            保存中...
          </>
        ) : (
          <>
            <Check size={12} strokeWidth={2.5} className="text-accent-green" />
            已保存
          </>
        )}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onExportPdf}
          className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-white shadow-[0_4px_14px_rgba(15,25,36,0.18)] transition-colors hover:bg-[#1A2D40]"
        >
          <Download size={15} strokeWidth={2} />
          导出 PDF
        </button>
      </div>
    </header>
  );
}
