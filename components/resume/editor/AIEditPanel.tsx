"use client";

import { Sparkles } from "lucide-react";
import { AI_QUICK_PROMPTS } from "./sections";

export function AIEditPanel() {
  return (
    <div className="shrink-0 border-t border-ink-soft/10 bg-white px-5 py-3.5">
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles size={14} strokeWidth={2} className="text-accent-ai" />
        <span className="text-[12px] font-medium text-ink-soft">
          AI 自然语言编辑
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="例如：“把这段工作经历改得更有数据感” / 更简洁，突出领导力"
          className="h-11 w-full rounded-[10px] border border-ink-soft/15 bg-fog/40 pl-3.5 pr-24 text-[13px] text-ink outline-none placeholder:text-ink-muted focus:border-brand/40 focus:bg-white focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="button"
          className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg bg-brand px-3.5 py-1.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand-hover"
        >
          <Sparkles size={14} strokeWidth={2} />
          生成
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {AI_QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="rounded-pill border border-ink-soft/15 px-2.5 py-1 text-[12px] text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
