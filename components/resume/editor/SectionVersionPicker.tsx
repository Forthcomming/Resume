"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Layers } from "lucide-react";
import clsx from "clsx";
import type { SectionSubVersion } from "@/lib/resume/versions";

interface SectionVersionPickerProps {
  versions: SectionSubVersion[];
  activeVersionId: string;
  onChange: (versionId: string) => void;
  onManageVersions?: () => void;
}

export function SectionVersionPicker({
  versions,
  activeVersionId,
  onChange,
  onManageVersions,
}: SectionVersionPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = versions.find((v) => v.id === activeVersionId) ?? versions[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!active) return null;

  return (
    <div ref={rootRef} className="relative ml-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="切换此板块的子版本"
        className={clsx(
          "flex h-8 max-w-[160px] items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium transition-all",
          open
            ? "border-ink/15 bg-white text-ink shadow-sm ring-2 ring-ink/5"
            : "border-ink-soft/10 bg-fog-soft/60 text-ink-soft hover:border-ink-soft/20 hover:bg-white hover:text-ink"
        )}
      >
        <Layers size={13} strokeWidth={2} className="shrink-0 text-ink-muted" />
        <span className="truncate">{active.name}</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={clsx(
            "shrink-0 text-ink-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="板块子版本"
          className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-[148px] overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-1 shadow-[0_12px_40px_rgba(15,25,36,0.12),0_2px_8px_rgba(15,25,36,0.06)] backdrop-blur-md"
        >
          {versions.map((version) => {
            const selected = version.id === activeVersionId;
            return (
              <button
                key={version.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(version.id);
                  setOpen(false);
                }}
                className={clsx(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] transition-colors",
                  selected
                    ? "bg-fog-soft/80 font-medium text-ink"
                    : "text-ink-soft hover:bg-fog-soft/50 hover:text-ink"
                )}
              >
                <span className="flex-1 truncate">{version.name}</span>
                {selected ? (
                  <Check size={14} strokeWidth={2.5} className="shrink-0 text-ink" />
                ) : (
                  <span className="h-3.5 w-3.5 shrink-0" />
                )}
              </button>
            );
          })}
          {onManageVersions ? (
            <>
              <div className="mx-2 my-1 border-t border-fog-soft/80" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onManageVersions();
                }}
                className="flex w-full rounded-xl px-3 py-2 text-left text-[12px] text-ink-soft transition-colors hover:bg-fog-soft/50 hover:text-ink"
              >
                管理子版本…
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
