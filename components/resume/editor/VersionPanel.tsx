"use client";

import { useState } from "react";
import { Layers, Plus, Copy, Pencil, Check, X } from "lucide-react";
import clsx from "clsx";
import type { VersionStore } from "@/lib/resume/versions";
import { formatVersionDate } from "@/lib/resume/versions";

interface VersionPanelProps {
  open: boolean;
  onToggle: () => void;
  store: VersionStore;
  onCreateVersion: (name: string) => void;
  onRenameVersion: (versionId: string, name: string) => void;
  onDuplicateVersion: (versionId: string) => void;
}

export function VersionPanel({
  open,
  onToggle,
  store,
  onCreateVersion,
  onRenameVersion,
  onDuplicateVersion,
}: VersionPanelProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreateVersion(name);
    setNewName("");
  };

  const startRename = (id: string, current: string) => {
    setEditingId(id);
    setEditName(current);
  };

  const commitRename = () => {
    if (editingId && editName.trim()) {
      onRenameVersion(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  return (
    <div className="no-print shrink-0 border-t border-ink-soft/10 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-5 py-2.5 text-left transition-colors hover:bg-fog/50"
      >
        <Layers size={15} strokeWidth={2} className="text-brand" />
        <span className="text-[13px] font-medium text-ink">版本管理</span>
        <span className="rounded-pill bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
          {store.versions.length} 个版本
        </span>
      </button>

      {open && (
        <div className="border-t border-ink-soft/10 bg-fog/30 px-5 py-3">
          <p className="mb-2 text-[11px] text-ink-muted">
            创建命名版本（如 ToC版、ToB版），在各板块选择来源版本进行组合投递。
          </p>

          {/* Create new version */}
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="新版本名称，如 ToB版"
              className="h-8 flex-1 rounded-lg border border-ink-soft/15 bg-white px-3 text-[12px] text-ink outline-none placeholder:text-ink-muted focus:border-brand/40 focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              <Plus size={13} strokeWidth={2} />
              保存为新版本
            </button>
          </div>

          {/* Version list */}
          <div className="space-y-1.5">
            {store.versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-2 rounded-lg border border-ink-soft/10 bg-white px-3 py-2"
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
                    <div className="min-w-0 flex-1">
                      <span className="text-[13px] font-medium text-ink">{v.name}</span>
                      <p className="text-[11px] text-ink-muted">
                        {formatVersionDate(v.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startRename(v.id, v.name)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-fog hover:text-ink"
                      title="重命名"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateVersion(v.id)}
                      className={clsx(
                        "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-ink-soft transition-colors hover:bg-fog hover:text-brand"
                      )}
                      title="复制为新版本"
                    >
                      <Copy size={12} />
                      复制
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
