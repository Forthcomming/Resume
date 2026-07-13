import { Check } from "lucide-react";
import { MATCH_BULLETS } from "./constants";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const PROGRESS = 0.87;
const DASH_OFFSET = CIRCUMFERENCE * (1 - PROGRESS);

export function MatchScoreSection() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-content items-center gap-10 rounded-landing border border-white/80 bg-white p-8 shadow-landing md:grid-cols-2 md:gap-14 md:p-12">
        <div className="flex flex-col items-center">
          <div className="relative h-44 w-44">
            <svg
              viewBox="0 0 128 128"
              className="h-full w-full -rotate-90"
              aria-hidden
            >
              <defs>
                <linearGradient
                  id="match-ring"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="100%" stopColor="#2DD4BF" />
                </linearGradient>
              </defs>
              <circle
                cx="64"
                cy="64"
                r={RADIUS}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="10"
              />
              <circle
                cx="64"
                cy="64"
                r={RADIUS}
                fill="none"
                stroke="url(#match-ring)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={DASH_OFFSET}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[40px] font-bold tabular-nums leading-none text-landing-ink">
                87%
              </span>
              <span className="mt-1 text-[12px] text-landing-muted">匹配度</span>
            </div>
          </div>
          <span className="mt-5 inline-flex items-center rounded-full bg-landing-accent-teal/15 px-3 py-1 text-[12px] font-medium text-teal-700">
            已对齐岗位需求
          </span>
        </div>

        <div>
          <h2 className="text-[24px] font-bold tracking-tight text-landing-ink md:text-[28px]">
            精准匹配岗位，不只是关键词。
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-landing-muted">
            ResumeKit
            对岗位描述做深度语义分析，结合你的结构化经历，生成真正贴合 JD
            的定制变体，而不是机械堆砌关键词。
          </p>
          <ul className="mt-6 space-y-3">
            {MATCH_BULLETS.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-landing-accent-teal/20 text-landing-accent-teal">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="text-[14px] leading-relaxed text-landing-ink">
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
