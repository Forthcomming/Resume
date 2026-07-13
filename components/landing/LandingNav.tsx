import Link from "next/link";
import { FileText } from "lucide-react";
import { NAV_LINKS } from "./constants";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-14 max-w-content items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-landing-cta text-white shadow-sm">
            <FileText size={14} strokeWidth={2.5} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-landing-ink">
            ResumeKit
          </span>
        </Link>

        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-[13px] text-landing-muted transition-colors hover:text-landing-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto">
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center rounded-lg bg-landing-cta px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            免费加入
          </Link>
        </div>
      </div>
    </header>
  );
}
