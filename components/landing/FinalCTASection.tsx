import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCTASection() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-content overflow-hidden rounded-landing border border-white/80 bg-gradient-to-br from-sky-50 via-white to-blue-50 px-8 py-14 text-center shadow-landing md:px-16 md:py-16">
        <h2 className="mx-auto max-w-xl text-[24px] font-bold leading-snug tracking-tight text-landing-ink md:text-[32px]">
          不再重复修改同一份简历，开始精准定制每个岗位。
        </h2>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-landing-cta px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
        >
          开始使用
          <ArrowRight size={16} strokeWidth={2.2} />
        </Link>
        <p className="mt-4 text-[13px] text-landing-muted">
          注册即送 5 次免费 AI 优化次数
        </p>
      </div>
    </section>
  );
}
