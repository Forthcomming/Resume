"use client";

import { Plus, Trash2, X, Sparkles, GripVertical } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import clsx from "clsx";
import { toggleInlineBoldMarkdown } from "@/lib/resume/inline-bold";

/** Shared chrome: always editable white; filled = stronger border + ink text. */
export function fieldClass(filled: boolean, multiline = false) {
  return clsx(
    "w-full rounded-xl border bg-white px-3.5 text-[13px] outline-none transition-colors focus:border-ink-soft/30 focus:text-ink focus:ring-2 focus:ring-ink/5",
    multiline ? "resize-y py-2.5 leading-relaxed" : "h-10",
    filled
      ? "border-ink-soft/25 text-ink"
      : "border-ink-soft/10 text-ink placeholder:text-ink-muted"
  );
}

function handleInlineBoldKeyDown(
  event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  value: string,
  onChange: (next: string) => void
) {
  if (!(event.key === "b" || event.key === "B")) return;
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) {
    return;
  }
  event.preventDefault();
  const el = event.currentTarget;
  const result = toggleInlineBoldMarkdown(
    value,
    el.selectionStart ?? 0,
    el.selectionEnd ?? 0
  );
  onChange(result.value);
  requestAnimationFrame(() => {
    el.setSelectionRange(result.selectionStart, result.selectionEnd);
  });
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const filled = value.trim().length > 0;
  return (
    <label className="block">
      <span
        className={clsx(
          "mb-1.5 block text-[12px] font-medium",
          filled ? "text-ink" : "text-ink-muted"
        )}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => handleInlineBoldKeyDown(e, value, onChange)}
        placeholder={placeholder}
        className={fieldClass(filled)}
      />
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const filled = value.trim().length > 0;
  return (
    <label className="block">
      {label && (
        <span
          className={clsx(
            "mb-1.5 block text-[12px] font-medium",
            filled ? "text-ink" : "text-ink-muted"
          )}
        >
          {label}
        </span>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => handleInlineBoldKeyDown(e, value, onChange)}
        placeholder={placeholder}
        rows={rows}
        className={fieldClass(filled, true)}
      />
    </label>
  );
}

/** Wrapper for a repeatable entry with a remove button and index label. */
export function EntryCard({
  label,
  onRemove,
  children,
  reorderable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  label: string;
  onRemove: () => void;
  children: React.ReactNode;
  reorderable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
}) {
  const [dragEnabled, setDragEnabled] = useState(false);

  return (
    <div
      draggable={reorderable && dragEnabled}
      onDragStart={reorderable ? onDragStart : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={() => {
        setDragEnabled(false);
        onDragEnd?.();
      }}
      className={clsx(
        "rounded-2xl border border-ink-soft/10 bg-fog-soft/40 p-4 transition-all",
        isDragging && "opacity-40 scale-[0.99]",
        isDragOver && "border-ink/25 ring-2 ring-ink/10"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {reorderable ? (
            <button
              type="button"
              aria-label="拖动排序"
              className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white hover:text-ink active:cursor-grabbing"
              onMouseDown={() => setDragEnabled(true)}
              onMouseUp={() => setDragEnabled(false)}
              onMouseLeave={() => {
                if (!isDragging) setDragEnabled(false);
              }}
            >
              <GripVertical size={14} strokeWidth={2} />
            </button>
          ) : null}
          <span className="text-[12px] font-medium text-ink-soft">{label}</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="删除"
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white hover:text-red-500"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
      {children}
    </div>
  );
}

export function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-ink-soft/20 py-2.5 text-[12px] text-ink-soft transition-colors hover:border-ink-soft/40 hover:bg-white/60 hover:text-ink"
    >
      <Plus size={14} strokeWidth={2} />
      {label}
    </button>
  );
}

/** Optional one-line entry summary with optional AI trigger (Task 6 wires AI). */
export function SummaryField({
  label = "总结句",
  value,
  onChange,
  aiOpen,
  onToggleAI,
}: {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  aiOpen?: boolean;
  onToggleAI?: () => void;
}) {
  const filled = value.trim().length > 0;
  return (
    <div>
      <span
        className={clsx(
          "mb-1 block text-[12px] font-medium",
          filled ? "text-ink" : "text-ink-muted"
        )}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => handleInlineBoldKeyDown(e, value, onChange)}
          placeholder="一句概括（可选）"
          className={fieldClass(filled)}
        />
        {onToggleAI && (
          <button
            type="button"
            onClick={onToggleAI}
            aria-label="AI 优化总结句"
            className={clsx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-accent-ai transition-colors hover:bg-accent-ai/10",
              aiOpen && "bg-accent-ai/15 ring-2 ring-accent-ai/20"
            )}
          >
            <Sparkles size={14} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Editable list of bullet lines, each with add/remove and optional AI trigger. */
export function BulletList({
  label,
  bullets,
  onChange,
  entryIndex,
  sectionId,
  bulletAIOpen,
  onToggleBulletAI,
}: {
  label?: string;
  bullets: string[];
  onChange: (next: string[]) => void;
  entryIndex?: number;
  sectionId?: "work" | "project" | "education";
  bulletAIOpen?: { entryIndex: number; bulletIndex: number } | null;
  onToggleBulletAI?: (entryIndex: number, bulletIndex: number) => void;
}) {
  const update = (i: number, v: string) => {
    const next = [...bullets];
    next[i] = v;
    onChange(next);
  };
  const add = () => onChange([...bullets, ""]);
  const remove = (i: number) => onChange(bullets.filter((_, idx) => idx !== i));

  return (
    <div>
      {label && (
        <span className="mb-1 block text-[12px] font-medium text-ink-soft">
          {label}
        </span>
      )}
      <div className="space-y-1.5">
        {bullets.map((b, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-ink-muted">•</span>
                <input
                  value={b}
                  onChange={(e) => update(i, e.target.value)}
                  onKeyDown={(e) =>
                    handleInlineBoldKeyDown(e, b, (next) => update(i, next))
                  }
                  placeholder="一条成就或职责描述"
                  className={fieldClass(b.trim().length > 0)}
                />
                {onToggleBulletAI && entryIndex !== undefined && sectionId && (
                  <button
                    type="button"
                    onClick={() => onToggleBulletAI(entryIndex, i)}
                    aria-label="AI 优化此条"
                    className={clsx(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-accent-ai transition-colors hover:bg-accent-ai/10",
                      bulletAIOpen?.entryIndex === entryIndex &&
                        bulletAIOpen?.bulletIndex === i &&
                        "bg-accent-ai/15 ring-2 ring-accent-ai/20"
                    )}
                  >
                    <Sparkles size={14} strokeWidth={2} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="删除"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-fog-soft hover:text-red-500"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 flex items-center gap-1 text-[12px] text-ink-soft transition-colors hover:text-ink"
      >
        <Plus size={13} strokeWidth={2} />
        添加一条
      </button>
    </div>
  );
}

/** Tag/chip input: type + Enter to add, click X to remove. */
export function TagInput({
  label,
  tags,
  onChange,
  placeholder = "输入后回车添加",
}: {
  label?: string;
  tags: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    if (!tags.includes(v)) onChange([...tags, v]);
    setDraft("");
  };

  return (
    <div>
      {label && (
        <span className="mb-1 block text-[12px] font-medium text-ink-soft">
          {label}
        </span>
      )}
      <div
        className={clsx(
          "flex flex-wrap items-center gap-1.5 rounded-xl border bg-white p-2.5 transition-colors focus-within:border-ink-soft/30 focus-within:ring-2 focus-within:ring-ink/5",
          tags.length > 0 ? "border-ink-soft/25" : "border-ink-soft/10"
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-fog-soft px-2.5 py-0.5 text-[12px] font-medium text-ink"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              aria-label={`删除 ${tag}`}
              className="text-ink-muted hover:text-ink"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            handleInlineBoldKeyDown(e, draft, setDraft);
            if (e.defaultPrevented) return;
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && !draft && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={commit}
          placeholder={tags.length ? "" : placeholder}
          className="min-w-[120px] flex-1 bg-transparent px-1 text-[13px] text-ink outline-none placeholder:text-ink-muted/75"
        />
      </div>
    </div>
  );
}
