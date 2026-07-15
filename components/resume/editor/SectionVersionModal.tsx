"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import clsx from "clsx";
import type { SectionSubVersion } from "@/lib/resume/versions";

interface SectionVersionModalProps {
  open: boolean;
  sectionTitle: string;
  versions: SectionSubVersion[];
  activeVersionId: string;
  onActiveVersionChange: (versionId: string) => void;
  onCreateSubVersion: (name: string) => void;
  onRenameSubVersion: (versionId: string, name: string) => void;
  onDuplicateSubVersion: (versionId: string) => void;
  onDeleteSubVersion: (versionId: string) => void;
  onClose: () => void;
}

export function SectionVersionModal({
  open,
  sectionTitle,
  versions,
  activeVersionId,
  onActiveVersionChange,
  onCreateSubVersion,
  onRenameSubVersion,
  onDuplicateSubVersion,
  onDeleteSubVersion,
  onClose,
}: SectionVersionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

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

  const handleDelete = (version: SectionSubVersion) => {
    if (versions.length <= 1) return;
    const ok = window.confirm(
      `确定删除子版本「${version.name}」？此操作不可恢复。`
    );
    if (!ok) return;
    if (editingId === version.id) {
      setEditingId(null);
      setEditName("");
    }
    onDeleteSubVersion(version.id);
  };

  const canDelete = versions.length > 1;

  if (!open || !mounted) return null;

  return createPortal(
    <div className="no-print fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="关闭"
        className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="section-version-modal-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-[0_24px_64px_rgba(15,25,36,0.18),0_8px_24px_rgba(15,25,36,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-fog-soft/80 px-5 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-ink-muted">
              <Layers size={15} strokeWidth={2} />
              <span className="text-[11px] font-medium uppercase tracking-wide">
                子版本管理
              </span>
            </div>
            <h2
              id="section-version-modal-title"
              className="text-[16px] font-semibold tracking-tight text-ink"
            >
              {sectionTitle}
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
              为「{sectionTitle}」准备多套内容，投递不同岗位时切换使用。
              <span className="text-ink-soft"> 仅替换本板块，其他板块和预览其余部分不变。</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-fog-soft hover:text-ink"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[min(60vh,420px)] overflow-auto px-5 py-4">
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="版本名称，如：大厂版、产品岗版"
              className="h-10 flex-1 rounded-full border border-ink-soft/10 bg-fog-soft/40 px-3.5 text-[13px] text-ink outline-none placeholder:text-ink-muted focus:border-ink-soft/25 focus:bg-white focus:ring-2 focus:ring-ink/5"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#1A2D40] disabled:opacity-50"
            >
              <Plus size={13} strokeWidth={2} />
              新建
            </button>
          </div>

          <div className="space-y-2">
            {versions.map((version) => {
              const isActive = version.id === activeVersionId;
              return (
                <div
                  key={version.id}
                  className={clsx(
                    "flex items-center gap-2 rounded-2xl border px-3 py-2.5",
                    isActive
                      ? "border-ink/10 bg-fog-soft/50"
                      : "border-ink-soft/8 bg-white"
                  )}
                >
                  {editingId === version.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-8 flex-1 rounded-full border border-ink-soft/15 px-3 text-[12px] outline-none focus:ring-2 focus:ring-ink/5"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={commitRename}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-white"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-white"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onActiveVersionChange(version.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="text-[13px] font-medium text-ink">
                          {version.name}
                        </span>
                        {isActive && (
                          <span className="ml-1.5 rounded-full bg-ink px-2 py-px text-[10px] font-medium text-white">
                            当前
                          </span>
                        )}
                        {version.createdBy === "ai" && (
                          <span className="ml-1 rounded-full bg-accent-ai/10 px-2 py-px text-[10px] font-medium text-accent-ai">
                            AI
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(version.id);
                          setEditName(version.name);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white hover:text-ink"
                        title="重命名"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateSubVersion(version.id)}
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] text-ink-soft transition-colors hover:bg-white hover:text-ink"
                        title="复制为新子版本"
                      >
                        <Copy size={12} />
                        复制
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(version)}
                        disabled={!canDelete}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-muted"
                        title={
                          canDelete ? "删除此子版本" : "至少保留一个子版本"
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
