import { Sparkles, LayoutTemplate, Eye, ShieldCheck } from "lucide-react";
import { FEATURES } from "./constants";

const ACCENT_BG = {
  blue: "bg-landing-accent-blue/15 text-landing-accent-blue",
  teal: "bg-landing-accent-teal/15 text-landing-accent-teal",
  purple: "bg-landing-accent-purple/15 text-landing-accent-purple",
  amber: "bg-landing-accent-amber/15 text-amber-500",
} as const;

const ICONS = {
  sparkles: Sparkles,
  layout: LayoutTemplate,
  eye: Eye,
  shield: ShieldCheck,
} as const;

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-content">
        <h2 className="text-center text-[28px] font-bold tracking-tight text-landing-ink md:text-[36px]">
          你想要的，一个不少。
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = ICONS[feature.icon];
            return (
              <article
                key={feature.title}
                className="rounded-landing border border-white/80 bg-white p-7 shadow-landing"
              >
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${ACCENT_BG[feature.accent]}`}
                >
                  <Icon size={20} strokeWidth={2} />
                </span>
                <h3 className="mt-4 text-[18px] font-semibold text-landing-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-landing-muted">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
