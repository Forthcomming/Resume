"use client";

import Link from "next/link";
import { ArrowRight, Loader2, RotateCcw, Sparkles } from "lucide-react";
import type { SaveState } from "./EditorTopBar";

export function JDTailorEntry({
  resumeId,
  title,
  saveState,
  onRetrySave,
}: {
  resumeId: string;
  title: string;
  saveState: SaveState;
  onRetrySave: () => void;
}) {
  const href = `/resume/${resumeId}/tailor?title=${encodeURIComponent(title)}`;

  return (
    <div className="shrink-0 border-t border-ink-soft/10 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fog-soft text-ink">
          <Sparkles size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink">按 JD 生成定制版</p>
        </div>

        {saveState === "error" ? (
          <button
            type="button"
            onClick={onRetrySave}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3.5 py-2 text-[12px] font-medium text-red-700 transition hover:bg-red-100 active:scale-[0.98]"
          >
            <RotateCcw size={13} />
            先重试保存
          </button>
        ) : saveState === "saving" ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-fog-soft px-3.5 py-2 text-[12px] font-medium text-ink-muted">
            <Loader2 size={13} className="animate-spin" />
            保存母版中
          </span>
        ) : (
          <Link
            href={href}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[12px] font-medium text-white transition hover:bg-[#26384a] active:scale-[0.98]"
          >
            生成适配方案
            <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}
