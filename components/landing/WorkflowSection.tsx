import {
  Upload,
  Search,
  Sparkles,
  PenLine,
  CheckCircle2,
} from "lucide-react";
import { WORKFLOW_STEPS } from "./constants";

const ACCENT_BG = {
  blue: "bg-landing-accent-blue text-white",
  teal: "bg-landing-accent-teal text-white",
  purple: "bg-landing-accent-purple text-white",
  amber: "bg-landing-accent-amber text-white",
  ink: "bg-landing-cta text-white",
} as const;

const STEP_ICONS = [Upload, Search, Sparkles, PenLine, CheckCircle2] as const;

export function WorkflowSection() {
  return (
    <section id="workflow" className="scroll-mt-20 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-content">
        <h2 className="text-center text-[28px] font-bold tracking-tight text-landing-ink md:text-[36px]">
          从上传到 Offer，五步完成。
        </h2>

        {/* Desktop timeline */}
        <div className="mt-14 hidden md:block">
          <div className="relative flex justify-between">
            <div
              className="absolute left-[10%] right-[10%] top-5 border-t-2 border-dashed border-slate-200"
              aria-hidden
            />
            {WORKFLOW_STEPS.map((step, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <div
                  key={step.label}
                  className="relative z-10 flex w-24 flex-col items-center"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm ${ACCENT_BG[step.accent]}`}
                  >
                    <Icon size={18} strokeWidth={2.2} />
                  </span>
                  <p className="mt-3 text-center text-[13px] font-medium text-landing-ink">
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile vertical */}
        <ol className="mt-10 space-y-0 md:hidden">
          {WORKFLOW_STEPS.map((step, i) => {
            const Icon = STEP_ICONS[i];
            const isLast = i === WORKFLOW_STEPS.length - 1;
            return (
              <li key={step.label} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${ACCENT_BG[step.accent]}`}
                  >
                    <Icon size={18} strokeWidth={2.2} />
                  </span>
                  {!isLast && (
                    <div className="my-1 w-0 flex-1 border-l-2 border-dashed border-slate-200" />
                  )}
                </div>
                <p className="pb-8 pt-2 text-[14px] font-medium text-landing-ink">
                  {step.label}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
