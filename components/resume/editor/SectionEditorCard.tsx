"use client";

import { useState, type DragEvent } from "react";
import { Sparkles, GripVertical } from "lucide-react";
import clsx from "clsx";
import type { EditorSection } from "./sections";
import { SectionForm } from "./forms/SectionForms";
import type { ResumeContent } from "@/lib/resume/content";
import type { SectionSubVersion } from "@/lib/resume/versions";
import type { DateDisplayFormat } from "@/lib/resume/date-display";
import type { PendingAIEdit } from "@/types/ai-edit";
import { SectionVersionPicker } from "./SectionVersionPicker";
import { SectionVersionModal } from "./SectionVersionModal";
import { EditableSectionTitle } from "./EditableSectionTitle";

interface SectionEditorCardProps {
  section: EditorSection;
  displayTitle: string;
  defaultTitle: string;
  onTitleChange: (title: string) => void;
  content: ResumeContent;
  onChange: (next: ResumeContent) => void;
  versions: SectionSubVersion[];
  activeVersionId: string;
  onActiveVersionChange: (versionId: string) => void;
  onCreateSubVersion: (name: string) => void;
  onRenameSubVersion: (versionId: string, name: string) => void;
  onDuplicateSubVersion: (versionId: string) => void;
  onDeleteSubVersion: (versionId: string) => void;
  aiOpen: boolean;
  onToggleAI: () => void;
  pendingAIEdit: PendingAIEdit | null;
  bulletAIOpen?: { entryIndex: number; bulletIndex: number } | null;
  onToggleBulletAI?: (entryIndex: number, bulletIndex: number) => void;
  dateDisplayFormat?: DateDisplayFormat;
  onDateDisplayFormatChange?: (format: DateDisplayFormat) => void;
  reorderable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
}

export function SectionEditorCard({
  section,
  displayTitle,
  defaultTitle,
  onTitleChange,
  content,
  onChange,
  versions,
  activeVersionId,
  onActiveVersionChange,
  onCreateSubVersion,
  onRenameSubVersion,
  onDuplicateSubVersion,
  onDeleteSubVersion,
  aiOpen,
  onToggleAI,
  pendingAIEdit,
  bulletAIOpen,
  onToggleBulletAI,
  dateDisplayFormat,
  onDateDisplayFormatChange,
  reorderable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: SectionEditorCardProps) {
  const Icon = section.icon;
  const sectionAiEnabled = section.id === "summary";
  const isSectionPending =
    sectionAiEnabled &&
    pendingAIEdit?.target.scope === "section" &&
    pendingAIEdit.target.sectionId === section.id;
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);

  return (
    <div
      draggable={reorderable && dragEnabled}
      onDragStart={reorderable ? onDragStart : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={() => {
        setDragEnabled(false);
        onDragEnd?.();
      }}
      className={clsx(
        "overflow-hidden rounded-[18px] border bg-white/95 shadow-card backdrop-blur-sm transition-all",
        isDragging && "opacity-40 scale-[0.99]",
        isDragOver
          ? "border-ink/25 shadow-card-hover ring-2 ring-ink/10"
          : "border-white/70"
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5 border-b border-fog-soft/80 px-5 py-3.5">
        {reorderable ? (
          <button
            type="button"
            aria-label="拖动排序"
            className="flex h-8 w-8 cursor-grab items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-fog-soft hover:text-ink active:cursor-grabbing"
            onMouseDown={() => setDragEnabled(true)}
            onMouseUp={() => setDragEnabled(false)}
            onMouseLeave={() => {
              if (!isDragging) setDragEnabled(false);
            }}
          >
            <GripVertical size={16} strokeWidth={2} />
          </button>
        ) : null}

        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-fog-soft text-ink-soft">
          <Icon size={15} strokeWidth={2} />
        </span>

        <EditableSectionTitle
          value={displayTitle}
          defaultValue={defaultTitle}
          onChange={onTitleChange}
        />

        <SectionVersionPicker
          versions={versions}
          activeVersionId={activeVersionId}
          onChange={onActiveVersionChange}
          onManageVersions={() => setVersionPanelOpen(true)}
        />

        {sectionAiEnabled && (
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleAI}
              className={clsx(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                aiOpen || isSectionPending
                  ? "border-accent-ai/40 bg-accent-ai/20 text-accent-ai shadow-sm"
                  : "border-accent-ai/20 bg-accent-ai/10 text-accent-ai hover:border-accent-ai/35 hover:bg-accent-ai/15"
              )}
            >
              <Sparkles size={14} strokeWidth={2} />
              AI 优化
            </button>
          </div>
        )}
      </div>

      <SectionVersionModal
        open={versionPanelOpen}
        sectionTitle={displayTitle}
        versions={versions}
        activeVersionId={activeVersionId}
        onActiveVersionChange={onActiveVersionChange}
        onCreateSubVersion={onCreateSubVersion}
        onRenameSubVersion={onRenameSubVersion}
        onDuplicateSubVersion={onDuplicateSubVersion}
        onDeleteSubVersion={onDeleteSubVersion}
        onClose={() => setVersionPanelOpen(false)}
      />

      <div className="px-5 py-5">
        <SectionForm
          sectionId={section.id as keyof ResumeContent}
          content={content}
          onChange={onChange}
          dateDisplayFormat={dateDisplayFormat}
          onDateDisplayFormatChange={onDateDisplayFormatChange}
          bulletAIOpen={bulletAIOpen}
          onToggleBulletAI={onToggleBulletAI}
        />
      </div>
    </div>
  );
}
