"use client";

import { Plus } from "lucide-react";
import { useNewResumeDialog } from "./NewResumeDialogProvider";

export function NewResumeButton() {
  const { open } = useNewResumeDialog();

  return (
    <button
      type="button"
      onClick={open}
      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand-hover"
    >
      <Plus size={15} strokeWidth={2.5} />
      新建简历
    </button>
  );
}
