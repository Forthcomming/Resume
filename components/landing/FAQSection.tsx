"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { FAQS } from "./constants";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-content">
        <h2 className="text-center text-[28px] font-bold tracking-tight text-landing-ink md:text-[36px]">
          常见问题解答
        </h2>

        <div className="mt-10 overflow-hidden rounded-landing border border-white/80 bg-white shadow-landing">
          {FAQS.map((faq, i) => {
            const open = openIndex === i;
            return (
              <div
                key={faq.question}
                className={clsx(
                  i > 0 && "border-t border-slate-100"
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={open}
                >
                  <span className="text-[15px] font-medium text-landing-ink">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={18}
                    className={clsx(
                      "shrink-0 text-landing-muted transition-transform duration-200",
                      open && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={clsx(
                    "grid transition-[grid-template-rows] duration-200",
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-[14px] leading-relaxed text-landing-muted">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
