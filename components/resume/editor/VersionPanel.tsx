"use client";

import { Layers } from "lucide-react";
import type { SectionSubVersionsStore } from "@/lib/resume/versions";
import { countAllSubVersions } from "@/lib/resume/versions";

interface VersionPanelProps {
  open: boolean;
  onToggle: () => void;
  store: SectionSubVersionsStore;
}

/**
 * Lightweight help panel. Per-section sub-versions are managed on each
 * SectionEditorCard; resume-level documents live on the dashboard.
 */
export function VersionPanel({ open, onToggle, store }: VersionPanelProps) {
  const total = countAllSubVersions(store);

  return (
    <div className="no-print shrink-0 border-t border-ink-soft/10 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-5 py-2.5 text-left transition-colors hover:bg-fog/50"
      >
        <Layers size={15} strokeWidth={2} className="text-brand" />
        <span className="text-[13px] font-medium text-ink">板块子版本</span>
        <span className="rounded-pill bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
          共 {total} 个
        </span>
      </button>

      {open && (
        <div className="border-t border-ink-soft/10 bg-fog/30 px-5 py-3 text-[12px] leading-relaxed text-ink-soft">
          <p>
            每个板块可独立维护子版本（如项目经历的 ToB版 / ToC版）。在板块标题旁切换或点「子版本」管理。
          </p>
          <p className="mt-1.5">
            简历文档（大版本）请在首页简历库中管理；此处只影响当前文档内的板块内容。
          </p>
        </div>
      )}
    </div>
  );
}
