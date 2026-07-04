"use client";

import { useState } from "react";
import { Sparkles, Plus, Copy, Pencil, Check, X } from "lucide-react";
import clsx from "clsx";
import type { EditorSection } from "./sections";
import { SectionForm } from "./forms/SectionForms";
import type { ResumeContent } from "@/lib/resume/content";
import type { SectionSubVersion } from "@/lib/resume/versions";
import type { PendingAIEdit } from "@/types/ai-edit";
import { AIInlinePrompt } from "./AIInlinePrompt";
import { AIDiffView } from "./AIDiffView";

interface SectionEditorCardProps {
  section: EditorSection;
  content: ResumeContent;
  onChange: (next: ResumeContent) => void;
  versions: SectionSubVersion[];
  activeVersionId: string;
  onActiveVersionChange: (versionId: string) => void;
  onCreateSubVersion: (name: string) => void;
  onRenameSubVersion: (versionId: string, name: string) => void;
  onDuplicateSubVersion: (versionId: string) => void;
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
  activeVersionId,
  onActiveVersionChange,
  onCreateSubVersion,
  onRenameSubVersion,
  onDuplicateSubVersion,
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
  const activeVersion = versions.find((v) => v.id === activeVersionId);
  const isSectionPending =
    pendingAIEdit?.target.scope === "section" &&
    pendingAIEdit.target.sectionId === section.id;
  const aiLoading = pendingAIEdit?.status === "loading" && isSectionPending;

  const [manageOpen, setManageOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreateSubVersion(name);
    setNewName("");
  };

  const commitRename = () => {
    if (editingId && editName.trim()) {
      onRenameSubVersion(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  return (
    <div className="overflow-hidden rounded-card border border-ink-soft/10 bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-soft/10 px-4 py-3">
        <Icon size={16} strokeWidth={2} className="text-ink-soft" />
        <h2 className="text-[14px] font-medium text-ink">{section.title}</h2>

        <select
          value={activeVersionId}
          onChange={(e) => onActiveVersionChange(e.target.value)}
          className="ml-1 h-7 max-w-[140px] rounded-md border border-ink-soft/15 bg-fog/40 px-2 text-[11px] text-ink outline-none focus:border-brand/40"
          title="切换此板块的子版本"
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>

        {activeVersion && (
          <span className="rounded-pill bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
            {activeVersion.name}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setManageOpen((o) => !o)}
            className={clsx(
              "rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors",
              manageOpen
                ? "border-brand/30 bg-brand-soft text-brand"
                : "border-transparent text-ink-soft hover:bg-fog hover:text-ink"
            )}
          >
            子版本
          </button>
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

      {manageOpen && (
        <div className="border-b border-ink-soft/10 bg-fog/40 px-4 py-3">
          <p className="mb-2 text-[11px] text-ink-muted">
            为本板块创建子版本（如 ToB版、ToC版），切换后仅影响「{section.title}」。
          </p>

          <div className="mb-2 flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="如 ToB版"
              className="h-8 flex-1 rounded-lg border border-ink-soft/15 bg-white px-3 text-[12px] text-ink outline-none placeholder:text-ink-muted focus:border-brand/40 focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              <Plus size={13} strokeWidth={2} />
              新建
            </button>
          </div>

          <div className="space-y-1.5">
            {versions.map((v) => {
              const isActive = v.id === activeVersionId;
              return (
                <div
                  key={v.id}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-2",
                    isActive
                      ? "border-brand/30 bg-brand-soft/40"
                      : "border-ink-soft/10 bg-white"
                  )}
                >
                  {editingId === v.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-7 flex-1 rounded-md border border-brand/30 px-2 text-[12px] outline-none focus:ring-2 focus:ring-brand/20"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={commitRename}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-brand hover:bg-brand-soft"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-fog"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onActiveVersionChange(v.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="text-[13px] font-medium text-ink">
                          {v.name}
                        </span>
                        {isActive && (
                          <span className="ml-1.5 rounded-pill bg-brand px-1.5 py-px text-[10px] font-medium text-white">
                            当前
                          </span>
                        )}
                        {v.createdBy === "ai" && (
                          <span className="ml-1 rounded-pill bg-accent-ai/10 px-1.5 py-px text-[10px] font-medium text-accent-ai">
                            AI
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(v.id);
                          setEditName(v.name);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-fog hover:text-ink"
                        title="重命名"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateSubVersion(v.id)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-ink-soft hover:bg-fog hover:text-brand"
                        title="复制为新子版本"
                      >
                        <Copy size={12} />
                        复制
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {aiOpen && !isSectionPending && (
        <div className="border-b border-ink-soft/10 px-4 py-3">
          <AIInlinePrompt
            placeholder={`优化「${section.title}」当前子版本，如：改得更有数据感`}
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
