"use client";

import { Plus } from "lucide-react";
import { useNewResumeDialog } from "./NewResumeDialogProvider";

export function NewResumeCard() {
  const { open } = useNewResumeDialog();

  return (
    <button
      type="button"
      onClick={open}
      className="group flex min-h-[150px] flex-col items-center justify-center gap-2.5 rounded-card border border-dashed border-ink-soft/30 bg-white/40 text-center transition-colors hover:border-brand/50 hover:bg-white/70"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-soft/25 text-ink-soft transition-colors group-hover:border-brand/40 group-hover:text-brand">
        <Plus size={18} strokeWidth={2} />
      </span>
      <span className="text-[13px] text-ink-soft transition-colors group-hover:text-ink">
        新建简历
      </span>
    </button>
  );
}
