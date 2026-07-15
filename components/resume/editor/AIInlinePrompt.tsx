"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { AI_QUICK_PROMPTS } from "./sections";

interface AIInlinePromptProps {
  placeholder?: string;
  onSubmit: (instruction: string) => void;
  loading?: boolean;
  onCancel?: () => void;
  variant?: "inline" | "plain";
}

export function AIInlinePrompt({
  placeholder = "输入改写指令，如：量化数据、突出成果",
  onSubmit,
  loading,
  onCancel,
  variant = "inline",
}: AIInlinePromptProps) {
  const [instruction, setInstruction] = useState("");

  const submit = (text?: string) => {
    const value = (text ?? instruction).trim();
    if (!value || loading) return;
    onSubmit(value);
    setInstruction("");
  };

  return (
    <div
      className={
        variant === "inline"
          ? "rounded-2xl border border-accent-ai/20 bg-accent-ai/[0.06] p-3.5"
          : "p-0"
      }
    >
      {variant === "inline" && (
        <div className="mb-2 flex items-center gap-1.5">
          <Sparkles size={13} strokeWidth={2} className="text-accent-ai" />
          <span className="text-[11px] font-medium text-accent-ai">AI 优化</span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="ml-auto text-[11px] text-ink-muted hover:text-ink"
            >
              取消
            </button>
          )}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          disabled={loading}
          placeholder={placeholder}
          className="h-10 w-full rounded-full border border-ink-soft/10 bg-white pl-3.5 pr-20 text-[12px] text-ink outline-none placeholder:text-ink-muted focus:border-ink-soft/20 focus:ring-2 focus:ring-ink/5 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => submit()}
          disabled={loading || !instruction.trim()}
          className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-[#1A2D40] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} strokeWidth={2} />
          )}
          生成
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {AI_QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => submit(prompt)}
            disabled={loading}
            className="rounded-full border border-ink-soft/10 bg-white px-2.5 py-1 text-[11px] text-ink-soft transition-colors hover:border-ink-soft/25 hover:text-ink disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
