const VERSIONS = [
  { name: "产品经理 · 字节跳动", match: 92, active: true },
  { name: "数据分析 · 美团", match: 86, active: false },
  { name: "交互设计 · 网易", match: 81, active: false },
] as const;

export function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[440px] lg:max-w-none">
      <div className="rounded-landing border border-white/80 bg-white p-5 shadow-landing-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-landing-muted">
              我的简历变体
            </p>
            <p className="mt-0.5 text-[15px] font-semibold text-landing-ink">
              主简历 · 2024 秋招
            </p>
          </div>
          <span className="rounded-full bg-landing-accent-blue/10 px-2.5 py-1 text-[11px] font-medium text-landing-accent-blue">
            3 个版本
          </span>
        </div>

        <ul className="space-y-2.5">
          {VERSIONS.map((v) => (
            <li
              key={v.name}
              className={`flex items-center justify-between rounded-xl border px-3.5 py-3 ${
                v.active
                  ? "border-landing-accent-blue/30 bg-sky-50/80"
                  : "border-slate-100 bg-slate-50/50"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-landing-ink">
                  {v.name}
                </p>
                <p className="mt-0.5 text-[11px] text-landing-muted">
                  匹配度{" "}
                  <span
                    className={`font-semibold tabular-nums ${
                      v.active
                        ? "text-landing-accent-blue"
                        : "text-landing-ink"
                    }`}
                  >
                    {v.match}%
                  </span>
                </p>
              </div>
              <span
                className={`pointer-events-none shrink-0 select-none rounded-lg px-3 py-1.5 text-[12px] font-medium ${
                  v.active
                    ? "bg-landing-cta text-white"
                    : "bg-white text-landing-muted ring-1 ring-slate-200"
                }`}
              >
                {v.active ? "优化中" : "优化"}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-xl bg-gradient-to-r from-sky-50 to-teal-50 px-3.5 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-landing-muted">整体匹配度</span>
            <span className="text-[18px] font-bold tabular-nums text-landing-ink">
              87%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-landing-accent-blue to-landing-accent-teal"
              style={{ width: "87%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
