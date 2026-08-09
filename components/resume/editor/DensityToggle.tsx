"use client";

import { RESUME_DENSITY_OPTIONS, type ResumeDensity } from "@/lib/resume/density";

export function DensityToggle({
  value,
  onChange,
}: {
  value: ResumeDensity;
  onChange: (density: ResumeDensity) => void;
}) {
  return (
    <div
      role="group"
      aria-label="简历密度"
      className="flex items-center rounded-full border border-ink-soft/10 bg-fog-soft/70 p-0.5"
    >
      {RESUME_DENSITY_OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              active
                ? "rounded-full bg-white px-2.5 py-1 text-[12px] font-medium text-ink shadow-sm"
                : "rounded-full px-2.5 py-1 text-[12px] text-ink-muted transition-colors hover:text-ink"
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
