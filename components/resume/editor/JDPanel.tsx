"use client";

import { useState } from "react";
import { Target, ChevronUp, Sparkles } from "lucide-react";
import clsx from "clsx";

export function JDPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="shrink-0 border-t border-white/60 bg-white/80 backdrop-blur-md">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-5 py-3.5 text-left transition-colors hover:bg-fog-soft/40"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-fog-soft text-ink-soft">
          <Target size={14} strokeWidth={2} />
        </span>
        <span className="text-[13px] font-medium text-ink">
          JD 定向核心优势生成
        </span>
        <span className="rounded-full bg-accent-ai/12 px-2.5 py-0.5 text-[11px] font-medium text-accent-ai">
          升级版
        </span>
        <ChevronUp
          size={16}
          strokeWidth={2}
          className={clsx(
            "ml-auto text-ink-muted transition-transform",
            open ? "" : "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="space-y-3 px-5 pb-5">
          <input
            type="text"
            placeholder="目标岗位名称，如：字节跳动 · 高级产品经理"
            className="h-10 w-full rounded-xl border border-ink-soft/10 bg-fog-soft/50 px-3.5 text-[13px] text-ink outline-none placeholder:text-ink-muted focus:border-ink-soft/20 focus:bg-white focus:ring-2 focus:ring-ink/5"
          />
          <textarea
            rows={4}
            placeholder="粘贴目标岗位 JD 全文，AI 将结合你的简历提炼核心优势..."
            className="w-full resize-none rounded-xl border border-ink-soft/10 bg-fog-soft/50 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink-muted focus:border-ink-soft/20 focus:bg-white focus:ring-2 focus:ring-ink/5"
          />
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-white shadow-[0_4px_14px_rgba(15,25,36,0.16)] transition-colors hover:bg-[#1A2D40]"
          >
            <Sparkles size={14} strokeWidth={2} />
            生成核心优势
          </button>
        </div>
      )}
    </div>
  );
}
