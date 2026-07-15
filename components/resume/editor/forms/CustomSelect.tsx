"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import clsx from "clsx";

export function CustomSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  align = "left",
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  options: readonly { value: string; label: string }[];
  className?: string;
  align?: "left" | "right";
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active =
    options.find((opt) => opt.value === value) ??
    options.find((opt) => opt.value === "") ??
    options[0];

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

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={clsx(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-left transition-all",
          compact ? "text-[12px]" : "text-[13px]",
          open
            ? "border-ink-soft/20 bg-white text-ink shadow-sm ring-2 ring-ink/5"
            : "border-ink-soft/10 bg-white text-ink-soft hover:border-ink-soft/20 hover:text-ink"
        )}
      >
        <span className="truncate">{active?.label ?? "请选择"}</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={clsx(
            "shrink-0 text-ink-muted transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={clsx(
            "absolute top-[calc(100%+6px)] z-40 min-w-full overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-1 shadow-[0_12px_40px_rgba(15,25,36,0.12),0_2px_8px_rgba(15,25,36,0.06)] backdrop-blur-md",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value || "__empty"}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={clsx(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors",
                  compact ? "text-[12px]" : "text-[13px]",
                  selected
                    ? "bg-fog-soft/80 font-medium text-ink"
                    : "text-ink-soft hover:bg-fog-soft/50 hover:text-ink"
                )}
              >
                <span className="flex-1 whitespace-nowrap">{opt.label}</span>
                {selected ? (
                  <Check
                    size={14}
                    strokeWidth={2.5}
                    className="shrink-0 text-ink"
                  />
                ) : (
                  <span className="h-3.5 w-3.5 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
