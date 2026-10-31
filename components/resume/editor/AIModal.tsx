"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import { AIInlinePrompt } from "./AIInlinePrompt";
import { AIDiffView } from "./AIDiffView";
import { AIOriginalPanel } from "./AIOriginalPanel";
import { AIClarificationForm } from "./AIClarificationForm";
import { formatAIEditDisplayValue } from "@/lib/ai/display-value";
import type {
  AIEditAnswers,
  EditTarget,
  PendingAIEdit,
} from "@/types/ai-edit";

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
  onSubmitClarification: (answers: AIEditAnswers) => void;
  onSubmitConservative: () => void;
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
  onSubmitClarification,
  onSubmitConservative,
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
  const showClarification = pendingAIEdit?.status === "needs_input";
  const showAnalyzing = pendingAIEdit?.status === "analyzing";
  const showGenerating = pendingAIEdit?.status === "generating";

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
        className="glass-panel relative z-10 flex w-full max-w-2xl max-h-[min(88vh,680px)] flex-col overflow-hidden rounded-[20px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-fog-soft/80 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <Sparkles
                size={15}
                strokeWidth={2}
                className="mt-1 shrink-0 text-accent-ai"
              />
              <div className="min-w-0">
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
            </div>
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
          {!showDiff && !showClarification && (
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

          {showAnalyzing && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <Sparkles
                size={28}
                strokeWidth={1.5}
                className="animate-pulse text-accent-ai"
              />
              <p className="text-[13px] font-medium text-ink">
                AI 正在判断哪些信息足以支持改写…
              </p>
            </div>
          )}

          {showGenerating && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <Sparkles
                size={28}
                strokeWidth={1.5}
                className="animate-pulse text-accent-ai"
              />
              <p className="text-[13px] font-medium text-ink">
                AI 正在根据补充事实生成建议…
              </p>
            </div>
          )}

          {showClarification && pendingAIEdit.status === "needs_input" && (
            <AIClarificationForm
              diagnosis={pendingAIEdit.diagnosis}
              questions={pendingAIEdit.questions}
              onSubmit={onSubmitClarification}
              onConservative={onSubmitConservative}
            />
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

          {showDiff && pendingAIEdit?.status === "ready" && (
            <div className="space-y-3">
              {(pendingAIEdit.improvements?.length ?? 0) > 0 && (
                <div className="rounded-xl border border-accent-ai/15 bg-accent-ai/[0.05] px-3.5 py-3">
                  <p className="mb-1.5 text-[11px] font-medium text-accent-ai">
                    本次改进
                  </p>
                  <ul className="space-y-1">
                    {(pendingAIEdit.improvements ?? []).map((item) => (
                      <li
                        key={item}
                        className="text-[12px] leading-relaxed text-ink-soft"
                      >
                        · {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <AIDiffView
                variant="modal"
                target={pendingAIEdit.target}
                original={pendingAIEdit.original}
                suggested={pendingAIEdit.suggested}
                onAccept={onAccept}
                onReject={onDismissSuggestion}
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
