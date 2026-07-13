import { STORY_CARDS } from "./constants";

const TAG_STYLE = {
  blue: "bg-landing-accent-blue/15 text-sky-700",
  teal: "bg-landing-accent-teal/15 text-teal-700",
  purple: "bg-landing-accent-purple/15 text-violet-700",
} as const;

export function StoryCardsSection() {
  return (
    <section id="stories" className="scroll-mt-20 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-content">
        <h2 className="text-center text-[28px] font-bold tracking-tight text-landing-ink md:text-[36px]">
          同一段经历，讲出不同故事。
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STORY_CARDS.map((card) => (
            <article
              key={card.role}
              className="flex flex-col rounded-landing border border-white/80 bg-white p-6 shadow-landing"
            >
              <span
                className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[12px] font-medium ${TAG_STYLE[card.accent]}`}
              >
                {card.role}
              </span>
              <p className="mt-3 text-[13px] text-landing-muted">
                {card.company}
              </p>
              <ul className="mt-4 flex-1 space-y-2.5">
                {card.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex gap-2 text-[13px] leading-relaxed text-landing-ink"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-landing-muted" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
