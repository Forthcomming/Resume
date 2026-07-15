import { Play } from "lucide-react";
import { SOCIAL_PROOF_AVATARS } from "./constants";
import { HeroMockup } from "./HeroMockup";
import { EnterSystemButton } from "@/components/settings/EnterSystemButton";

export function HeroSection() {
  return (
    <section className="px-6 pb-10 pt-16 md:pb-14 md:pt-20">
      <div className="mx-auto grid max-w-content items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h1 className="text-[36px] font-bold leading-[1.15] tracking-tight text-landing-ink md:text-[48px] lg:text-[52px]">
            一份简历，无限定制变体。
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-landing-muted md:text-[16px]">
            针对不同岗位 JD，一键生成定制版简历变体。结构化板块库 +
            AI 语义匹配，让每一次投递都更精准。
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <EnterSystemButton className="inline-flex h-11 items-center rounded-lg bg-landing-cta px-6 text-[15px] font-medium text-white transition-opacity hover:opacity-90">
              立即体验
            </EnterSystemButton>
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-landing-accent-blue transition-opacity hover:opacity-80"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-landing-accent-blue/15">
                <Play size={12} fill="currentColor" strokeWidth={0} />
              </span>
              了解更多
            </a>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {SOCIAL_PROOF_AVATARS.map((gradient) => (
                <span
                  key={gradient}
                  className={`h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br ${gradient}`}
                />
              ))}
            </div>
            <p className="text-[13px] text-landing-muted">
              已获得{" "}
              <span className="font-semibold text-landing-ink">2000+</span>{" "}
              位求职者的青睐（我猜的）
            </p>
          </div>
        </div>

        <HeroMockup />
      </div>
    </section>
  );
}
