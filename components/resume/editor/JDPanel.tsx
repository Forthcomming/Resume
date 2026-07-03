"use client";

import { useState } from "react";
import { Target, ChevronUp, Sparkles } from "lucide-react";
import clsx from "clsx";

export function JDPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="shrink-0 border-t border-ink-soft/10 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-5 py-3 text-left"
      >
        <Target size={15} strokeWidth={2} className="text-ink-soft" />
        <span className="text-[13px] font-medium text-ink">
          JD 定向核心优势生成
        </span>
        <span className="rounded-pill bg-accent-ai/15 px-2 py-0.5 text-[11px] font-medium text-accent-ai">
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
        <div className="space-y-3 px-5 pb-4">
          <input
            type="text"
            placeholder="目标岗位名称，如：字节跳动 · 高级产品经理"
            className="h-10 w-full rounded-[10px] border border-ink-soft/15 bg-fog/40 px-3.5 text-[13px] text-ink outline-none placeholder:text-ink-muted focus:border-brand/40 focus:bg-white focus:ring-2 focus:ring-brand/20"
          />
          <textarea
            rows={4}
            placeholder="粘贴目标岗位 JD 全文，AI 将结合你的简历提炼核心优势..."
            className="w-full resize-none rounded-[10px] border border-ink-soft/15 bg-fog/40 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink-muted focus:border-brand/40 focus:bg-white focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand-hover"
          >
            <Sparkles size={14} strokeWidth={2} />
            生成核心优势
          </button>
        </div>
      )}
    </div>
  );
}
