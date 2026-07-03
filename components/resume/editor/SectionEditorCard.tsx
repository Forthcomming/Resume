"use client";

import { Sparkles } from "lucide-react";
import clsx from "clsx";
import type { EditorSection } from "./sections";
import { SectionForm } from "./forms/SectionForms";
import type { ResumeContent } from "@/lib/resume/content";
import type { ResumeVersion } from "@/lib/resume/versions";
import type { PendingAIEdit } from "@/types/ai-edit";
import { AIInlinePrompt } from "./AIInlinePrompt";
import { AIDiffView } from "./AIDiffView";

interface SectionEditorCardProps {
  section: EditorSection;
  content: ResumeContent;
  onChange: (next: ResumeContent) => void;
  versions: ResumeVersion[];
  sourceVersionId: string;
  onSourceVersionChange: (versionId: string) => void;
  aiOpen: boolean;
  onToggleAI: () => void;
  pendingAIEdit: PendingAIEdit | null;
  onAIRequest: (instruction: string) => void;
  onAIAccept: () => void;
  onAIReject: () => void;
  onBulletAIRequest?: (
    entryIndex: number,
    bulletIndex: number,
    instruction: string
  ) => void;
  bulletAIOpen?: { entryIndex: number; bulletIndex: number } | null;
  onToggleBulletAI?: (entryIndex: number, bulletIndex: number) => void;
}

export function SectionEditorCard({
  section,
  content,
  onChange,
  versions,
  sourceVersionId,
  onSourceVersionChange,
  aiOpen,
  onToggleAI,
  pendingAIEdit,
  onAIRequest,
  onAIAccept,
  onAIReject,
  onBulletAIRequest,
  bulletAIOpen,
  onToggleBulletAI,
}: SectionEditorCardProps) {
  const Icon = section.icon;
  const sourceVersion = versions.find((v) => v.id === sourceVersionId);
  const isSectionPending =
    pendingAIEdit?.target.scope === "section" &&
    pendingAIEdit.target.sectionId === section.id;
  const aiLoading = pendingAIEdit?.status === "loading" && isSectionPending;

  return (
    <div className="overflow-hidden rounded-card border border-ink-soft/10 bg-white shadow-card">
      <div className="flex items-center gap-2.5 border-b border-ink-soft/10 px-4 py-3">
        <Icon size={16} strokeWidth={2} className="text-ink-soft" />
        <h2 className="text-[14px] font-medium text-ink">{section.title}</h2>

        <select
          value={sourceVersionId}
          onChange={(e) => onSourceVersionChange(e.target.value)}
          className="ml-1 h-7 rounded-md border border-ink-soft/15 bg-fog/40 px-2 text-[11px] text-ink outline-none focus:border-brand/40"
          title="选择此板块的来源版本"
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>

        {sourceVersion && (
          <span className="rounded-pill bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
            {sourceVersion.name}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleAI}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors",
              aiOpen
                ? "border-accent-ai/30 bg-accent-ai/10 text-accent-ai"
                : "border-transparent text-ink-soft hover:bg-fog hover:text-accent-ai"
            )}
          >
            <Sparkles size={14} strokeWidth={2} />
            AI 优化
          </button>
        </div>
      </div>

      {aiOpen && !isSectionPending && (
        <div className="border-b border-ink-soft/10 px-4 py-3">
          <AIInlinePrompt
            placeholder={`优化「${section.title}」板块，如：改得更有数据感`}
            onSubmit={onAIRequest}
            loading={aiLoading}
            onCancel={onToggleAI}
          />
        </div>
      )}

      {isSectionPending && pendingAIEdit && (
        <div className="border-b border-ink-soft/10 px-4 py-3">
          {pendingAIEdit.status === "loading" ? (
            <div className="flex items-center gap-2 rounded-lg border border-accent-ai/20 bg-accent-ai/5 px-3 py-2 text-[12px] text-accent-ai">
              <Sparkles size={14} className="animate-pulse" />
              AI 正在生成建议...
            </div>
          ) : pendingAIEdit.status === "error" ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {pendingAIEdit.error}
              <button type="button" onClick={onAIReject} className="ml-2 underline">
                关闭
              </button>
            </div>
          ) : (
            <AIDiffView
              target={pendingAIEdit.target}
              original={pendingAIEdit.original}
              suggested={pendingAIEdit.suggested}
              onAccept={onAIAccept}
              onReject={onAIReject}
            />
          )}
        </div>
      )}

      <div className="px-4 py-4">
        <SectionForm
          sectionId={section.id as keyof ResumeContent}
          content={content}
          onChange={onChange}
          onBulletAIRequest={onBulletAIRequest}
          bulletAIOpen={bulletAIOpen}
          onToggleBulletAI={onToggleBulletAI}
          pendingAIEdit={pendingAIEdit}
          onAIAccept={onAIAccept}
          onAIReject={onAIReject}
        />
      </div>
    </div>
  );
}
