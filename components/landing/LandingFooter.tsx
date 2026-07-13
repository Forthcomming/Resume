import Link from "next/link";
import { FileText } from "lucide-react";
import { FOOTER_COLUMNS } from "./constants";

export function LandingFooter() {
  return (
    <footer className="bg-landing-ink text-white">
      <div className="mx-auto max-w-content px-6 py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-white/10 text-white">
                <FileText size={14} strokeWidth={2.5} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">
                ResumeKit
              </span>
            </Link>
            <p className="mt-4 text-[13px] leading-relaxed text-slate-400">
              模块化简历优化工具 — 把一份简历变成无限岗位定制变体。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-[13px] font-semibold text-white">
                  {col.title}
                </p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <span className="cursor-default text-[13px] text-slate-400 transition-colors hover:text-slate-200">
                        {link}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-[12px] text-slate-500">
            © {new Date().getFullYear()} ResumeKit. All rights reserved.
          </p>
          <div className="flex gap-4 text-[12px] text-slate-500">
            <span>隐私政策</span>
            <span>服务条款</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
