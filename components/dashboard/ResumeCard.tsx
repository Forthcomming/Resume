"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Resume } from "@/types/resume";
import { removeLocalResume, upsertLocalResume } from "@/lib/resume/local-storage";
import {
  deleteResumeAction,
  updateResumeTitleAction,
} from "@/app/resume/[id]/actions";

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(d, now)) return `今天 ${time}`;
  if (isSameDay(d, yesterday)) return `昨天 ${time}`;

  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${y}-${m}-${day} ${time}`;
}

export function ResumeCard({
  resume,
  localOnly = false,
  onDeleted,
}: {
  resume: Resume;
  localOnly?: boolean;
  onDeleted?: (id: string) => void;
}) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draftTitle, setDraftTitle] = useState(resume.title);
  const [busy, setBusy] = useState(false);

  const href = localOnly
    ? `/resume/${resume.id}?title=${encodeURIComponent(resume.title)}`
    : `/resume/${resume.id}`;

  useEffect(() => {
    setDraftTitle(resume.title);
  }, [resume.title]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  const handleRename = async () => {
    const next = draftTitle.trim() || "未命名简历";
    if (next === resume.title) {
      setRenaming(false);
      return;
    }
    setBusy(true);
    try {
      upsertLocalResume({ id: resume.id, title: next });
      if (!localOnly) {
        await updateResumeTitleAction(resume.id, next);
      }
      setRenaming(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setConfirmDelete(false);
    setMenuOpen(false);
    try {
      removeLocalResume(resume.id);
      onDeleted?.(resume.id);
      if (!localOnly) {
        await deleteResumeAction(resume.id);
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="group relative">
      <Link
        href={href}
        className="glass-panel flex min-h-[150px] flex-col rounded-card p-4 shadow-glass transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-glass-hover active:translate-y-0"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-landing-cta/10 text-landing-cta">
          <FileText size={16} strokeWidth={2} />
        </span>

        <h3 className="mt-3 pr-8 text-[14px] font-medium leading-snug text-ink">
          {resume.title}
        </h3>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {resume.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-pill bg-landing-cta/10 px-2 py-0.5 text-[11px] font-medium text-landing-cta"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="mt-auto pt-3 text-[12px] text-ink-muted">
          更新于 {formatUpdatedAt(resume.updatedAt)}
        </p>
      </Link>

      <div ref={menuRef} className="absolute right-2 top-2 z-10">
        <button
          type="button"
          disabled={busy}
          aria-label="简历操作"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="glass-control flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft opacity-100 transition-opacity hover:text-ink disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        >
          <MoreHorizontal size={16} strokeWidth={2} />
        </button>

        {menuOpen ? (
          <div
            role="menu"
            className="glass-control absolute right-0 mt-1 w-36 overflow-hidden rounded-xl py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => {
                setMenuOpen(false);
                setDraftTitle(resume.title);
                setRenaming(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink hover:bg-fog-soft"
            >
              <Pencil size={14} strokeWidth={2} />
              重命名
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => {
                setMenuOpen(false);
                setConfirmDelete(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} strokeWidth={2} />
              删除
            </button>
          </div>
        ) : null}
      </div>

      {renaming ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => !busy && setRenaming(false)}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`rename-resume-${resume.id}`}
            className="glass-panel relative w-full max-w-sm rounded-[20px] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id={`rename-resume-${resume.id}`}
              className="text-[16px] font-semibold text-ink"
            >
              重命名简历
            </h2>
            <input
              autoFocus
              value={draftTitle}
              disabled={busy}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleRename();
                if (e.key === "Escape") setRenaming(false);
              }}
              className="glass-control mt-3 h-10 w-full rounded-xl px-3.5 text-[13px] text-ink outline-none focus:ring-2 focus:ring-landing-cta/15"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setRenaming(false)}
                className="h-9 rounded-lg px-4 text-[13px] font-medium text-ink-muted hover:bg-fog-soft hover:text-ink"
              >
                取消
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleRename()}
                className="h-9 rounded-lg bg-landing-cta px-4 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmDelete ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => !busy && setConfirmDelete(false)}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-resume-${resume.id}`}
            className="glass-panel relative w-full max-w-sm rounded-[20px] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id={`delete-resume-${resume.id}`}
              className="text-[16px] font-semibold text-ink"
            >
              删除简历
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
              确定删除「{resume.title}」？此操作不可恢复。
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmDelete(false)}
                className="h-9 rounded-lg px-4 text-[13px] font-medium text-ink-muted hover:bg-fog-soft hover:text-ink"
              >
                取消
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDelete()}
                className="h-9 rounded-lg bg-red-600 px-4 text-[13px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
