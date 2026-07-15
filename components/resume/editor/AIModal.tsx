"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import { AIInlinePrompt } from "./AIInlinePrompt";
import { AIDiffView } from "./AIDiffView";
import { AIOriginalPanel } from "./AIOriginalPanel";
import { formatAIEditDisplayValue } from "@/lib/ai/display-value";
import type { EditTarget } from "@/types/ai-edit";
import type { PendingAIEdit } from "@/types/ai-edit";

interface AIModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  promptPlaceholder?: string;
  target: EditTarget;
  originalContent: unknown;
  pendingAIEdit: PendingAIEdit | null;
  onClose: () => void;
  onSubmit: (instruction: string) => void;
  onAccept: () => void;
  onRetry: () => void;
  onDismissSuggestion: () => void;
}

export function AIModal({
  open,
  title,
  subtitle,
  promptPlaceholder,
  target,
  originalContent,
  pendingAIEdit,
  onClose,
  onSubmit,
  onAccept,
  onRetry,
  onDismissSuggestion,
}: AIModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const originalText = formatAIEditDisplayValue(target, originalContent);
  const showPrompt = !pendingAIEdit;
  const showDiff = pendingAIEdit?.status === "ready";

  return createPortal(
    <div className="no-print fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="关闭"
        className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-modal-title"
        className="relative z-10 flex w-full max-w-2xl max-h-[min(88vh,680px)] flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-[0_24px_64px_rgba(15,25,36,0.18),0_8px_24px_rgba(15,25,36,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-fog-soft/80 px-5 py-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-accent-ai">
              <Sparkles size={15} strokeWidth={2} />
              <span className="text-[11px] font-medium uppercase tracking-wide">
                AI 优化
              </span>
            </div>
            <h2
              id="ai-modal-title"
              className="text-[16px] font-semibold tracking-tight text-ink"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-[12px] text-ink-muted">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-fog-soft hover:text-ink"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          <p className="mb-4 rounded-xl border border-accent-ai/15 bg-accent-ai/[0.05] px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
            AI 仅提供参考建议，不会自动修改您的简历。请对比原文与建议后，自行决定是否采纳。
          </p>

          {!showDiff && (
            <AIOriginalPanel text={originalText} compact={!!pendingAIEdit} />
          )}

          {showPrompt && (
            <AIInlinePrompt
              variant="plain"
              placeholder={promptPlaceholder}
              onSubmit={onSubmit}
              loading={false}
            />
          )}

          {pendingAIEdit?.status === "loading" && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <Sparkles
                size={28}
                strokeWidth={1.5}
                className="animate-pulse text-accent-ai"
              />
              <p className="text-[13px] font-medium text-ink">AI 正在生成建议…</p>
              <p className="text-[12px] text-ink-muted">
                生成完成后将展示对比，由您决定是否采纳
              </p>
            </div>
          )}

          {pendingAIEdit?.status === "error" && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-[13px] leading-relaxed text-red-700">
              {pendingAIEdit.error ?? "AI 编辑失败，请稍后重试"}
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 block text-[12px] font-medium underline"
              >
                返回重新输入
              </button>
            </div>
          )}

          {showDiff && pendingAIEdit && (
            <AIDiffView
              variant="modal"
              target={pendingAIEdit.target}
              original={pendingAIEdit.original}
              suggested={pendingAIEdit.suggested}
              onAccept={onAccept}
              onReject={onDismissSuggestion}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
