import Link from "next/link";
import { ChevronLeft, FileText, Check, Download, Loader2 } from "lucide-react";

export type SaveState = "saving" | "saved";

export function EditorTopBar({
  title,
  saveState = "saved",
  onExportPdf,
}: {
  title: string;
  saveState?: SaveState;
  onExportPdf?: () => void;
}) {
  return (
    <header className="no-print flex h-12 shrink-0 items-center gap-3 border-b border-ink-soft/10 bg-white px-4">
      <Link
        href="/dashboard"
        aria-label="返回"
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-fog hover:text-ink"
      >
        <ChevronLeft size={18} strokeWidth={2} />
      </Link>

      <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-brand text-white">
        <FileText size={13} strokeWidth={2.5} />
      </span>
      <span className="text-[14px] font-medium text-ink">{title}</span>

      <span className="ml-2 flex items-center gap-1 text-[12px] text-ink-muted">
        {saveState === "saving" ? (
          <>
            <Loader2 size={13} strokeWidth={2} className="animate-spin" />
            保存中...
          </>
        ) : (
          <>
            <Check size={13} strokeWidth={2} />
            已保存
          </>
        )}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onExportPdf}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-1.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-brand-hover"
        >
          <Download size={15} strokeWidth={2} />
          导出 PDF
        </button>
      </div>
    </header>
  );
}
