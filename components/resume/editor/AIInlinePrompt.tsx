"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { AI_QUICK_PROMPTS } from "./sections";

interface AIInlinePromptProps {
  placeholder?: string;
  onSubmit: (instruction: string) => void;
  loading?: boolean;
  onCancel?: () => void;
}

export function AIInlinePrompt({
  placeholder = "输入改写指令，如：量化数据、突出成果",
  onSubmit,
  loading,
  onCancel,
}: AIInlinePromptProps) {
  const [instruction, setInstruction] = useState("");

  const submit = (text?: string) => {
    const value = (text ?? instruction).trim();
    if (!value || loading) return;
    onSubmit(value);
    setInstruction("");
  };

  return (
    <div className="rounded-lg border border-accent-ai/20 bg-accent-ai/5 p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5">
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
          className="h-9 w-full rounded-lg border border-ink-soft/15 bg-white pl-3 pr-20 text-[12px] text-ink outline-none placeholder:text-ink-muted focus:border-brand/40 focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => submit()}
          disabled={loading || !instruction.trim()}
          className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} strokeWidth={2} />
          )}
          生成
        </button>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {AI_QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => submit(prompt)}
            disabled={loading}
            className="rounded-pill border border-ink-soft/15 bg-white px-2 py-0.5 text-[11px] text-ink-soft transition-colors hover:border-brand/40 hover:text-brand disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
