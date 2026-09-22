"use client";

import { useState } from "react";
import { Target, ChevronUp, Loader2, Sparkles } from "lucide-react";
import clsx from "clsx";
import type { ResumeContent } from "@/lib/resume/content";
import { requestJdCheck } from "@/lib/ai/client-jd-check";
import { DEFAULT_SECTION_LABELS } from "@/lib/resume/versions";
import type { JdCheckIssue, JdIssueSeverity } from "@/types/jd-check";
import type { SectionId } from "@/types/ai-edit";

const SEVERITY_LABEL: Record<JdIssueSeverity, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export function JDPanel({
  content,
  onOptimize,
}: {
  content: ResumeContent;
  onOptimize: (sectionId: SectionId, instruction: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<JdCheckIssue[]>([]);

  const title = jobTitle.trim();
  const summaryLabel = title
    ? title
    : issues.length > 0
      ? `${issues.length} 个问题`
      : "未设置";

  const handleCheck = async () => {
    if (loading) return;
    if (!jobDescription.trim()) {
      setError("请先粘贴岗位 JD");
      setOpen(true);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await requestJdCheck({
        content,
        jobTitle,
        jobDescription,
      });
      setIssues(result.issues);
      setOpen(true);
    } catch (err) {
      setIssues([]);
      setError(err instanceof Error ? err.message : "检查失败，请稍后重试");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shrink-0 border-t border-ink-soft/10 bg-white">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-fog-soft/40"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-fog-soft text-ink-soft">
            <Target size={14} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-medium text-ink">
              简历定向优化
            </span>
            <span className="block truncate text-[11px] text-ink-muted">
              {summaryLabel}
            </span>
          </span>
          <ChevronUp
            size={16}
            strokeWidth={2}
            className={clsx(
              "shrink-0 text-ink-muted transition-transform",
              open ? "" : "rotate-180"
            )}
          />
        </button>
        <button
          type="button"
          onClick={() => void handleCheck()}
          disabled={loading}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#1A2D40] disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={13} strokeWidth={2} className="animate-spin" />
          ) : (
            <Sparkles size={13} strokeWidth={2} />
          )}
          {loading ? "检查中…" : "检查问题"}
        </button>
      </div>

      {open && (
        <div className="space-y-3 px-5 pb-5">
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="目标岗位名称，如：字节跳动 · 高级产品经理"
            className="glass-control h-10 w-full rounded-xl px-3.5 text-[13px] text-ink outline-none placeholder:text-ink-muted focus:border-ink-soft/20 focus:bg-white focus:ring-2 focus:ring-ink/5"
          />
          <textarea
            rows={4}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="粘贴目标岗位 JD 全文，AI 将检查当前简历的匹配问题..."
            className="glass-control w-full resize-none rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink-muted focus:border-ink-soft/20 focus:bg-white focus:ring-2 focus:ring-ink/5"
          />

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] leading-relaxed text-red-700">
              {error}
            </p>
          ) : null}

          {issues.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-medium text-ink">
                  发现 {issues.length} 个问题
                </p>
                <button
                  type="button"
                  onClick={() => void handleCheck()}
                  disabled={loading}
                  className="text-[12px] text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
                >
                  重新检查
                </button>
              </div>
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-xl border border-ink-soft/10 bg-fog-soft/30 px-3.5 py-3"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={clsx(
                        "mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                        issue.severity === "high" && "bg-red-100 text-red-700",
                        issue.severity === "medium" &&
                          "bg-amber-100 text-amber-700",
                        issue.severity === "low" && "bg-fog-soft text-ink-soft"
                      )}
                    >
                      {SEVERITY_LABEL[issue.severity]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium leading-snug text-ink">
                        {issue.title}
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                        依据：{issue.evidence}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-ink-soft">
                          建议：{DEFAULT_SECTION_LABELS[issue.sectionId]}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onOptimize(issue.sectionId, issue.instruction)
                          }
                          className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-ink shadow-sm ring-1 ring-ink-soft/10 transition-colors hover:bg-fog-soft"
                        >
                          去优化
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!loading && !error && issues.length === 0 && jobDescription.trim() ? (
            <p className="text-[12px] text-ink-muted">
              点击「检查问题」，对照 JD 查看当前简历缺口。
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
