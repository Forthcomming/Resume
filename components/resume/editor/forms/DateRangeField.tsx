"use client";

import {
  DATE_DISPLAY_FORMAT_OPTIONS,
  normalizeMonthValue,
  type DateDisplayFormat,
} from "@/lib/resume/date-display";
import { CustomSelect } from "./CustomSelect";

const monthClass =
  "h-10 min-w-0 flex-1 rounded-xl border border-ink-soft/10 bg-white px-3 text-[13px] text-ink-soft outline-none transition-colors focus:border-ink-soft/20 focus:text-ink focus:ring-2 focus:ring-ink/5 [color-scheme:light]";

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-ink-soft">
        {label}
      </span>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={options}
        ariaLabel={label}
      />
    </label>
  );
}

export function DateRangeField({
  label = "时间",
  startDate,
  endDate,
  onChange,
  dateDisplayFormat,
  onDateDisplayFormatChange,
}: {
  label?: string;
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  dateDisplayFormat?: DateDisplayFormat;
  onDateDisplayFormatChange?: (format: DateDisplayFormat) => void;
}) {
  const isPresent = endDate.trim() === "present";
  const startValue = normalizeMonthValue(startDate);
  const endValue = isPresent ? "" : normalizeMonthValue(endDate);

  return (
    <div className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-ink-soft">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="month"
          value={/^\d{4}-\d{2}$/.test(startValue) ? startValue : ""}
          onChange={(e) => onChange(e.target.value, endDate)}
          className={monthClass}
        />
        <span className="shrink-0 text-[12px] text-ink-muted">至</span>
        <input
          type="month"
          value={/^\d{4}-\d{2}$/.test(endValue) ? endValue : ""}
          onChange={(e) => onChange(startDate, e.target.value)}
          disabled={isPresent}
          className={monthClass}
        />
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[12px] text-ink-soft">
          <input
            type="checkbox"
            checked={isPresent}
            onChange={(e) =>
              onChange(startDate, e.target.checked ? "present" : "")
            }
            className="h-3.5 w-3.5 rounded border-ink-soft/20 text-ink focus:ring-ink/10"
          />
          至今
        </label>
        {dateDisplayFormat && onDateDisplayFormatChange && (
          <CustomSelect
            className="ml-auto w-[132px]"
            value={dateDisplayFormat}
            onChange={(v) =>
              onDateDisplayFormatChange(v as DateDisplayFormat)
            }
            options={DATE_DISPLAY_FORMAT_OPTIONS}
            ariaLabel="日期展示格式"
            align="right"
            compact
          />
        )}
      </div>
    </div>
  );
}
