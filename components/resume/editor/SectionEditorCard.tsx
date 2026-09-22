"use client";

import { useState } from "react";
import { Sparkles, ChevronUp, ChevronDown } from "lucide-react";
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
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
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
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
}: SectionEditorCardProps) {
  const Icon = section.icon;
  const sectionAiEnabled = section.id === "summary";
  const isSectionPending =
    sectionAiEnabled &&
    pendingAIEdit?.target.scope === "section" &&
    pendingAIEdit.target.sectionId === section.id;
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);

  return (
    <div className="glass-panel overflow-hidden rounded-[18px] transition-all">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-fog-soft/80 px-5 py-3.5">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="上移"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-fog-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-muted"
          >
            <ChevronUp size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="下移"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-fog-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-muted"
          >
            <ChevronDown size={16} strokeWidth={2} />
          </button>
        </div>

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
