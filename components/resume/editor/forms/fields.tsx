"use client";

import { Plus, Trash2, X, Sparkles } from "lucide-react";
import { useState } from "react";
import type { PendingAIEdit } from "@/types/ai-edit";
import { AIInlinePrompt } from "../AIInlinePrompt";
import { AIDiffView } from "../AIDiffView";

const inputClass =
  "h-9 w-full rounded-lg border border-ink-soft/15 bg-fog/40 px-3 text-[13px] text-ink outline-none placeholder:text-ink-muted focus:border-brand/40 focus:bg-white focus:ring-2 focus:ring-brand/20";

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
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink-soft">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
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
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-[12px] font-medium text-ink-soft">
          {label}
        </span>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-lg border border-ink-soft/15 bg-fog/40 px-3 py-2 text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink-muted focus:border-brand/40 focus:bg-white focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}

/** Wrapper for a repeatable entry with a remove button and index label. */
export function EntryCard({
  label,
  onRemove,
  children,
}: {
  label: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-ink-soft/15 bg-fog/30 p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[12px] font-medium text-ink-soft">{label}</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="删除"
          className="flex h-6 w-6 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-white hover:text-red-500"
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
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-soft/25 py-2 text-[12px] text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
    >
      <Plus size={14} strokeWidth={2} />
      {label}
    </button>
  );
}

/** Editable list of bullet lines, each with add/remove and optional AI trigger. */
export function BulletList({
  label,
  bullets,
  onChange,
  entryIndex,
  sectionId,
  onBulletAIRequest,
  bulletAIOpen,
  onToggleBulletAI,
  pendingAIEdit,
  onAIAccept,
  onAIReject,
}: {
  label?: string;
  bullets: string[];
  onChange: (next: string[]) => void;
  entryIndex?: number;
  sectionId?: "work" | "project" | "education";
  onBulletAIRequest?: (
    entryIndex: number,
    bulletIndex: number,
    instruction: string
  ) => void;
  bulletAIOpen?: { entryIndex: number; bulletIndex: number } | null;
  onToggleBulletAI?: (entryIndex: number, bulletIndex: number) => void;
  pendingAIEdit?: PendingAIEdit | null;
  onAIAccept?: () => void;
  onAIReject?: () => void;
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
        {bullets.map((b, i) => {
          const isBulletOpen =
            bulletAIOpen?.entryIndex === entryIndex &&
            bulletAIOpen?.bulletIndex === i;
          const isBulletPending =
            pendingAIEdit?.target.scope === "bullet" &&
            pendingAIEdit.target.entryIndex === entryIndex &&
            pendingAIEdit.target.bulletIndex === i &&
            sectionId &&
            pendingAIEdit.target.sectionId === sectionId;

          return (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-ink-muted">•</span>
                <input
                  value={b}
                  onChange={(e) => update(i, e.target.value)}
                  placeholder="一条成就或职责描述"
                  className={inputClass}
                />
                {onToggleBulletAI && entryIndex !== undefined && sectionId && (
                  <button
                    type="button"
                    onClick={() => onToggleBulletAI(entryIndex, i)}
                    aria-label="AI 优化此条"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-accent-ai transition-colors hover:bg-accent-ai/10"
                  >
                    <Sparkles size={14} strokeWidth={2} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="删除"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-fog hover:text-red-500"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>

              {isBulletOpen &&
                !isBulletPending &&
                onBulletAIRequest &&
                entryIndex !== undefined && (
                  <AIInlinePrompt
                    placeholder="优化此条描述，如：加入量化数据"
                    onSubmit={(instruction) =>
                      onBulletAIRequest(entryIndex, i, instruction)
                    }
                    loading={pendingAIEdit?.status === "loading"}
                    onCancel={() => onToggleBulletAI?.(entryIndex, i)}
                  />
                )}

              {isBulletPending && pendingAIEdit && onAIAccept && onAIReject && (
                <>
                  {pendingAIEdit.status === "loading" ? (
                    <div className="flex items-center gap-2 rounded-lg border border-accent-ai/20 bg-accent-ai/5 px-3 py-2 text-[12px] text-accent-ai">
                      <Sparkles size={14} className="animate-pulse" />
                      AI 正在生成建议...
                    </div>
                  ) : pendingAIEdit.status === "error" ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                      {pendingAIEdit.error}
                      <button type="button" onClick={onAIReject} className="ml-2 underline">
                        关闭
                      </button>
                    </div>
                  ) : (
                    <AIDiffView
                      target={pendingAIEdit.target}
                      original={pendingAIEdit.original}
                      suggested={pendingAIEdit.suggested}
                      onAccept={onAIAccept}
                      onReject={onAIReject}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-1.5 flex items-center gap-1 text-[12px] text-ink-soft transition-colors hover:text-brand"
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
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-ink-soft/15 bg-fog/40 p-2 focus-within:border-brand/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/20">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-pill bg-brand-soft px-2 py-0.5 text-[12px] font-medium text-brand"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              aria-label={`删除 ${tag}`}
              className="text-brand/70 hover:text-brand"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && !draft && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={commit}
          placeholder={tags.length ? "" : placeholder}
          className="min-w-[120px] flex-1 bg-transparent px-1 text-[13px] text-ink outline-none placeholder:text-ink-muted"
        />
      </div>
    </div>
  );
}
