import { STATS } from "./constants";

export function StatsBar() {
  return (
    <section className="px-6 pb-12 md:pb-16">
      <div className="mx-auto flex max-w-content flex-col items-stretch gap-6 rounded-landing border border-white/70 bg-white/70 px-8 py-8 shadow-landing sm:flex-row sm:items-center sm:justify-around sm:gap-4">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-1 flex-col items-center text-center ${
              i > 0 ? "sm:border-l sm:border-slate-100" : ""
            }`}
          >
            <p className="text-[36px] font-bold tabular-nums leading-none tracking-tight text-landing-ink md:text-[44px]">
              {stat.value}
            </p>
            <p className="mt-2 text-[13px] text-landing-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
