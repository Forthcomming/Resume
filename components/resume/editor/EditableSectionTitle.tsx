"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

export function EditableSectionTitle({
  value,
  defaultValue,
  onChange,
}: {
  value: string;
  defaultValue: string;
  onChange: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const next = draft.trim() || defaultValue;
    setDraft(next);
    onChange(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="h-8 min-w-[5rem] max-w-[180px] rounded-full border border-ink-soft/15 bg-white px-3 text-[15px] font-medium tracking-tight text-ink outline-none focus:border-ink-soft/25 focus:ring-2 focus:ring-ink/5"
        aria-label="板块标题"
      />
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      <h2 className="truncate text-[15px] font-medium tracking-tight text-ink">
        {value}
      </h2>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-fog-soft hover:text-ink"
        title="修改板块标题"
        aria-label="修改板块标题"
      >
        <Pencil size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
