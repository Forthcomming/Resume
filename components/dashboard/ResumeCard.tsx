import Link from "next/link";
import { FileText } from "lucide-react";
import type { Resume } from "@/types/resume";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ResumeCard({
  resume,
  localOnly = false,
}: {
  resume: Resume;
  localOnly?: boolean;
}) {
  const href = localOnly
    ? `/resume/${resume.id}?title=${encodeURIComponent(resume.title)}`
    : `/resume/${resume.id}`;

  return (
    <Link
      href={href}
      className="group flex min-h-[150px] flex-col rounded-card border border-white/70 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brand-soft text-brand">
        <FileText size={16} strokeWidth={2} />
      </span>

      <h3 className="mt-3 text-[14px] font-medium leading-snug text-ink">
        {resume.title}
      </h3>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {resume.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-pill bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="mt-auto pt-3 text-[12px] text-ink-muted">
        更新于 {formatDate(resume.updatedAt)}
      </p>
    </Link>
  );
}
