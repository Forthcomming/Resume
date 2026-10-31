"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import clsx from "clsx";
import {
  editableHtmlToMarkdown,
  markdownToEditableHtml,
} from "@/lib/resume/inline-bold";

function richFieldClass(filled: boolean, multiline: boolean) {
  return clsx(
    "w-full rounded-xl border bg-white px-3.5 text-[13px] outline-none transition-colors focus:border-ink-soft/30 focus:text-ink focus:ring-2 focus:ring-ink/5",
    multiline ? "resize-y py-2.5 leading-relaxed" : "flex h-10 items-center",
    filled
      ? "border-ink-soft/25 text-ink"
      : "border-ink-soft/10 text-ink placeholder:text-ink-muted"
  );
}

export function RichTextInput({
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 4,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (focused && value === lastEmitted.current) return;
    const current = editableHtmlToMarkdown(el.innerHTML);
    if (current === value) {
      lastEmitted.current = value;
      return;
    }
    el.innerHTML = markdownToEditableHtml(value);
    lastEmitted.current = value;
  }, [value, focused]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const next = editableHtmlToMarkdown(el.innerHTML);
    lastEmitted.current = next;
    if (next !== value) onChange(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      (event.key === "b" || event.key === "B") &&
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.shiftKey
    ) {
      event.preventDefault();
      document.execCommand("bold");
      emit();
      return;
    }
    if (!multiline && event.key === "Enter") {
      event.preventDefault();
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    const sanitized = multiline ? text : text.replace(/\s+/g, " ").trim();
    document.execCommand("insertText", false, sanitized);
    emit();
  };

  const filled = value.trim().length > 0;
  const showPlaceholder = Boolean(placeholder) && !filled && !focused;

  return (
    <div className="relative">
      {showPlaceholder ? (
        <span
          className={clsx(
            "pointer-events-none absolute left-3.5 z-[1] text-[13px] text-ink-muted/80",
            multiline ? "top-2.5" : "top-1/2 -translate-y-1/2"
          )}
        >
          {placeholder}
        </span>
      ) : null}
      <div
        ref={ref}
        role="textbox"
        aria-multiline={multiline || undefined}
        contentEditable
        suppressContentEditableWarning
        className={clsx(
          richFieldClass(filled, multiline),
          multiline ? "whitespace-pre-wrap" : "overflow-hidden whitespace-nowrap",
          className
        )}
        style={
          multiline
            ? ({ minHeight: `${Math.max(rows, 2) * 1.55}em` } as CSSProperties)
            : undefined
        }
        onInput={emit}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          emit();
        }}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
      />
    </div>
  );
}
