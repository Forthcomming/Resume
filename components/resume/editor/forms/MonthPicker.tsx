"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

const MONTHS = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
] as const;

function parseMonthValue(value: string): { year: number; month: number } | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function formatMonthValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function MonthPicker({
  value,
  onChange,
  disabled = false,
  ariaLabel = "选择年月",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const parsed = useMemo(() => parseMonthValue(value), [value]);
  const now = useMemo(() => new Date(), []);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(
    () => parsed?.year ?? now.getFullYear()
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setViewYear(parsed?.year ?? now.getFullYear());
  }, [open, parsed?.year, now]);

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
    <div ref={rootRef} className={clsx("relative min-w-0 flex-1", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={clsx(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-left text-[13px] transition-all",
          disabled && "cursor-not-allowed opacity-50",
          open
            ? "border-ink-soft/20 bg-white text-ink shadow-sm ring-2 ring-ink/5"
            : "border-ink-soft/10 bg-white text-ink-soft hover:border-ink-soft/20 hover:text-ink"
        )}
      >
        <span className={clsx("truncate", !parsed && "text-ink-muted")}>
          {parsed ? formatMonthValue(parsed.year, parsed.month) : "请选择"}
        </span>
        <Calendar size={14} strokeWidth={2} className="shrink-0 text-ink-muted" />
      </button>

      {open && !disabled ? (
        <div
          role="dialog"
          aria-label={ariaLabel}
          className="absolute left-0 top-[calc(100%+6px)] z-40 w-[260px] overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-3 shadow-[0_12px_40px_rgba(15,25,36,0.12),0_2px_8px_rgba(15,25,36,0.06)] backdrop-blur-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="上一年"
              onClick={() => setViewYear((y) => y - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-fog-soft hover:text-ink"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <span className="text-[13px] font-semibold text-ink">{viewYear}</span>
            <button
              type="button"
              aria-label="下一年"
              onClick={() => setViewYear((y) => y + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-fog-soft hover:text-ink"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {MONTHS.map((label, index) => {
              const month = index + 1;
              const selected =
                parsed?.year === viewYear && parsed.month === month;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    onChange(formatMonthValue(viewYear, month));
                    setOpen(false);
                  }}
                  className={clsx(
                    "h-9 rounded-xl text-[12px] font-medium transition-colors",
                    selected
                      ? "bg-ink text-white"
                      : "text-ink-soft hover:bg-fog-soft hover:text-ink"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-fog-soft/80 pt-2.5">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-lg px-2 py-1 text-[12px] text-ink-muted transition-colors hover:bg-fog-soft hover:text-ink"
            >
              清除
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                onChange(
                  formatMonthValue(today.getFullYear(), today.getMonth() + 1)
                );
                setOpen(false);
              }}
              className="rounded-lg px-2 py-1 text-[12px] font-medium text-ink transition-colors hover:bg-fog-soft"
            >
              本月
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
