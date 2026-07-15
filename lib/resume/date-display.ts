export type DateDisplayFormat = "YYYY-MM" | "YYYY.MM" | "YYYY年MM月";

export const DEFAULT_DATE_DISPLAY_FORMAT: DateDisplayFormat = "YYYY-MM";

export const DATE_DISPLAY_FORMATS: DateDisplayFormat[] = [
  "YYYY.MM",
  "YYYY-MM",
  "YYYY年MM月",
];

export function isDateDisplayFormat(value: unknown): value is DateDisplayFormat {
  return (
    typeof value === "string" &&
    (DATE_DISPLAY_FORMATS as string[]).includes(value)
  );
}

export const DATE_DISPLAY_FORMAT_OPTIONS: {
  value: DateDisplayFormat;
  label: string;
}[] = DATE_DISPLAY_FORMATS.map((value) => ({ value, label: value }));

/** Normalize free-text dates like 2022.09 → 2022-09 for storage. */
export function normalizeMonthValue(value: string): string {
  const v = value.trim();
  if (!v || v === "present") return v;
  const dotted = v.match(/^(\d{4})\.(\d{1,2})$/);
  if (dotted) {
    return `${dotted[1]}-${dotted[2].padStart(2, "0")}`;
  }
  const dashed = v.match(/^(\d{4})-(\d{1,2})$/);
  if (dashed) {
    return `${dashed[1]}-${dashed[2].padStart(2, "0")}`;
  }
  return v;
}

export function formatDateDisplay(
  value: string,
  format: DateDisplayFormat = DEFAULT_DATE_DISPLAY_FORMAT
): string {
  const v = value.trim();
  if (!v) return "";
  if (v === "present") return "至今";
  const normalized = normalizeMonthValue(v);
  if (format === "YYYY.MM") return normalized.replace(/-/g, ".");
  if (format === "YYYY年MM月") {
    const parts = normalized.match(/^(\d{4})-(\d{2})$/);
    if (parts) return `${parts[1]}年${parts[2]}月`;
  }
  return normalized;
}

export function formatDateRange(
  start: string,
  end: string,
  format: DateDisplayFormat = DEFAULT_DATE_DISPLAY_FORMAT
): string {
  const s = formatDateDisplay(start, format);
  const e = formatDateDisplay(end, format);
  if (!s && !e) return "";
  return [s, e].filter(Boolean).join(" – ");
}
