"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDashed,
  FilePlus2,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import clsx from "clsx";
import { createTailoredResumeAction } from "@/app/resume/[id]/actions";
import { requestAIEdit } from "@/lib/ai/client-edit";
import { requestJdAdaptationPlan } from "@/lib/ai/client-jd-plan";
import type { ResumeContent } from "@/lib/resume/content";
import {
  readLocalResumeContent,
  saveLocalResumeWorkspace,
} from "@/lib/resume/local-storage";
import { buildTailoredWorkspace } from "@/lib/resume/tailored-copy";
import { defaultTailoredResumeTitle } from "@/lib/resume/tailoring";
import {
  DEFAULT_SECTION_LABELS,
  initSectionSubVersionsStore,
  readSectionSubVersionsStore,
  type SectionSubVersionsStore,
} from "@/lib/resume/versions";
import type {
  JdAdaptationPlan,
  JdRecommendationAction,
  SelectedTailoringActions,
} from "@/types/jd-tailoring";

interface TailorWorkspaceProps {
  resumeId: string;
  sourceTitle: string;
  initialContent: ResumeContent | null;
  initialVersionStore: SectionSubVersionsStore | null;
  cloudBacked: boolean;
}

const COVERAGE_STYLE = {
  covered: { label: "已覆盖", className: "bg-emerald-50 text-emerald-700" },
  weak: { label: "可加强", className: "bg-amber-50 text-amber-700" },
  missing: { label: "暂无证据", className: "bg-slate-100 text-slate-600" },
} as const;

function getSuggestedBullet(
  suggested: unknown,
  action: Extract<JdRecommendationAction, { type: "rewrite_bullet" }>
): string | null {
  if (!suggested || typeof suggested !== "object") return null;
  const entries = (suggested as { entries?: unknown }).entries;
  if (!Array.isArray(entries)) return null;
  const entry = entries[action.entryIndex] as
    | { bullets?: unknown; notes?: unknown }
    | undefined;
  const items = Array.isArray(entry?.bullets)
    ? entry.bullets
    : Array.isArray(entry?.notes)
      ? entry.notes
      : null;
  const value = items?.[action.bulletIndex];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function TailorWorkspace({
  resumeId,
  sourceTitle,
  initialContent,
  initialVersionStore,
  cloudBacked,
}: TailorWorkspaceProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [store, setStore] = useState(
    initialVersionStore ??
      (initialContent ? initSectionSubVersionsStore(initialContent) : null)
  );
  const [hydrated, setHydrated] = useState(Boolean(initialContent));
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [plan, setPlan] = useState<JdAdaptationPlan | null>(null);
  const [selected, setSelected] = useState<SelectedTailoringActions>({
    switchActionIds: [],
    rewriteActionIds: [],
  });
  const [outputTitle, setOutputTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialContent) return;
    const localContent = readLocalResumeContent(resumeId);
    const localStore = readSectionSubVersionsStore(resumeId);
    setContent(localContent);
    setStore(
      localStore ?? (localContent ? initSectionSubVersionsStore(localContent) : null)
    );
    setHydrated(true);
  }, [initialContent, resumeId]);

  const selectableActions = useMemo(
    () => plan?.actions.filter((action) => action.type !== "keep") ?? [],
    [plan]
  );
  const selectedCount =
    selected.switchActionIds.length + selected.rewriteActionIds.length;

  const generatePlan = async () => {
    if (!content || !store || loading) return;
    if (!jobTitle.trim()) {
      setError("请填写目标岗位");
      return;
    }
    if (jobDescription.trim().length < 80) {
      setError("请粘贴完整 JD（至少 80 字），才能提取可靠的岗位要求");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await requestJdAdaptationPlan({
        title: sourceTitle,
        content,
        versionStore: store,
        companyName,
        jobTitle,
        jobDescription,
      });
      setPlan(result);
      setSelected({
        switchActionIds: result.actions
          .filter((action) => action.type === "switch_version")
          .map((action) => action.id),
        rewriteActionIds: result.actions
          .filter((action) => action.type === "rewrite_bullet")
          .map((action) => action.id),
      });
      setOutputTitle(defaultTailoredResumeTitle(companyName, jobTitle));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "生成方案失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const toggleAction = (action: JdRecommendationAction) => {
    if (action.type === "keep") return;
    const key =
      action.type === "switch_version"
        ? "switchActionIds"
        : "rewriteActionIds";
    setSelected((current) => ({
      ...current,
      [key]: current[key].includes(action.id)
        ? current[key].filter((id) => id !== action.id)
        : [...current[key], action.id],
    }));
  };

  const retryRewrite = async (
    action: Extract<JdRecommendationAction, { type: "rewrite_bullet" }>
  ) => {
    if (!store || retryingId) return;
    const version = store.sections[action.sectionId].versions.find(
      (item) => item.id === action.versionId
    );
    if (!version) return;
    setRetryingId(action.id);
    setError("");
    try {
      const result = await requestAIEdit(
        {
          scope: "bullet",
          sectionId: action.sectionId,
          entryIndex: action.entryIndex,
          bulletIndex: action.bulletIndex,
        },
        version.content,
        `针对${jobTitle}岗位重新改写这条经历。目标：${action.reason}。只使用原文已有事实与数据，不得虚构。`
      );
      const suggestion = getSuggestedBullet(result.suggested, action);
      if (!suggestion) throw new Error("AI 未返回有效 Bullet");
      setPlan((current) =>
        current
          ? {
              ...current,
              actions: current.actions.map((item) =>
                item.id === action.id && item.type === "rewrite_bullet"
                  ? { ...item, suggested: suggestion }
                  : item
              ),
            }
          : current
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "重新生成失败");
    } finally {
      setRetryingId(null);
    }
  };

  const createCopy = async () => {
    if (!content || !store || !plan || creating) return;
    if (!outputTitle.trim()) {
      setError("请填写新简历名称");
      return;
    }
    setCreating(true);
    setError("");
    try {
      let newId: string;
      if (cloudBacked) {
        const result = await createTailoredResumeAction({
          sourceResumeId: resumeId,
          plan,
          selected,
          outputTitle,
        });
        if (!result.ok || !result.id) {
          throw new Error(result.error ?? "创建定制简历失败");
        }
        newId = result.id;
      } else {
        const tailored = buildTailoredWorkspace({
          sourceTitle,
          sourceContent: content,
          sourceStore: store,
          expectedFingerprint: plan.sourceFingerprint,
          plan,
          selected,
          outputTitle,
        });
        newId = crypto.randomUUID();
        saveLocalResumeWorkspace(
          newId,
          tailored.title,
          tailored.content,
          tailored.versionStore
        );
      }
      router.push(
        `/resume/${newId}?title=${encodeURIComponent(outputTitle.trim())}`
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "创建定制简历失败");
      setCreating(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-muted">
        <Loader2 className="mr-2 animate-spin" size={16} /> 正在读取母版…
      </div>
    );
  }

  if (!content || !store) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
        <CircleDashed size={30} className="text-ink-muted" />
        <h1 className="mt-4 text-xl font-semibold text-ink">未找到母版内容</h1>
        <p className="mt-2 text-sm text-ink-muted">返回编辑器保存一次后再生成适配方案。</p>
        <Link href={`/resume/${resumeId}`} className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm text-white">
          返回编辑器
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-28">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-[#edf3f9]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            href={`/resume/${resumeId}?title=${encodeURIComponent(sourceTitle)}`}
            className="flex items-center gap-2 text-sm text-ink-muted transition hover:text-ink"
          >
            <ArrowLeft size={16} /> 返回母版
          </Link>
          <div className="text-center">
            <p className="text-sm font-semibold text-ink">按 JD 生成定制版</p>
            <p className="max-w-[45vw] truncate text-xs text-ink-muted">母版：{sourceTitle}</p>
          </div>
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs text-ink-muted ring-1 ring-white">
            母版不会被修改
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {!plan ? (
          <section className="mx-auto max-w-3xl">
            <div className="mb-7 text-center">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white shadow-lg shadow-slate-400/30">
                <Target size={20} />
              </span>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">这次投递，需要突出什么？</h1>
              <p className="mt-2 text-sm text-ink-muted">AI 会先找岗位要求与简历证据，再推荐版本切换或具体 Bullet 改写。</p>
            </div>
            <div className="glass-panel space-y-5 rounded-3xl p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-ink">
                  公司名称 <span className="font-normal text-ink-muted">（选填）</span>
                  <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="如：字节跳动" className="glass-control mt-2 h-11 w-full rounded-xl px-4 font-normal outline-none focus:ring-2 focus:ring-ink/10" />
                </label>
                <label className="space-y-2 text-sm font-medium text-ink">
                  目标岗位
                  <input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="如：AI 产品经理" className="glass-control mt-2 h-11 w-full rounded-xl px-4 font-normal outline-none focus:ring-2 focus:ring-ink/10" />
                </label>
              </div>
              <label className="block space-y-2 text-sm font-medium text-ink">
                岗位 JD
                <textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} rows={12} placeholder="粘贴完整岗位描述。内容越完整，证据匹配和版本推荐越可靠。" className="glass-control mt-2 w-full resize-y rounded-2xl px-4 py-3 font-normal leading-relaxed outline-none focus:ring-2 focus:ring-ink/10" />
              </label>
              {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
              <button type="button" onClick={() => void generatePlan()} disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-sm font-semibold text-white transition hover:bg-[#26384a] disabled:opacity-60">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {loading ? "正在梳理岗位要求与经历证据…" : "生成适配方案"}
              </button>
            </div>
          </section>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">适配方案</p>
                  <h1 className="mt-1 text-2xl font-semibold text-ink">{plan.companyName ? `${plan.companyName} · ` : ""}{plan.jobTitle}</h1>
                </div>
                <button type="button" onClick={() => { setPlan(null); setError(""); }} className="text-sm text-ink-muted hover:text-ink">修改 JD</button>
              </div>

              <section className="glass-panel rounded-3xl p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-2"><Target size={17} /><h2 className="font-semibold text-ink">1. 岗位重点与经历证据</h2></div>
                <div className="space-y-3">
                  {plan.requirements.map((requirement) => {
                    const coverage = COVERAGE_STYLE[requirement.coverage];
                    const evidence = plan.evidence.filter((item) => item.requirementId === requirement.id);
                    return (
                      <article key={requirement.id} className="rounded-2xl border border-ink-soft/10 bg-white/65 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div><h3 className="text-sm font-semibold text-ink">{requirement.title}</h3><p className="mt-1 text-xs leading-relaxed text-ink-muted">JD 原文：“{requirement.jdQuote}”</p></div>
                          <span className={clsx("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium", coverage.className)}>{coverage.label}</span>
                        </div>
                        {evidence.length ? (
                          <div className="mt-3 space-y-2 border-t border-ink-soft/10 pt-3">
                            {evidence.map((item) => <div key={item.id} className="flex gap-2 text-xs leading-relaxed"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" /><p><span className="font-medium text-ink">{DEFAULT_SECTION_LABELS[item.sectionId]} · {item.versionName}</span><span className="text-ink-muted">：{item.text}</span></p></div>)}
                          </div>
                        ) : <p className="mt-3 border-t border-ink-soft/10 pt-3 text-xs text-ink-muted">当前简历中没有足够证据；不会建议凭空补写。</p>}
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="glass-panel rounded-3xl p-5 sm:p-6">
                <div className="mb-1 flex items-center gap-2"><Sparkles size={17} /><h2 className="font-semibold text-ink">2. 推荐动作</h2></div>
                <p className="mb-4 text-xs text-ink-muted">勾选你认可的调整。只有勾选项会写入新副本。</p>
                {selectableActions.length ? <div className="space-y-3">{selectableActions.map((action) => {
                  const checked = action.type === "switch_version" ? selected.switchActionIds.includes(action.id) : selected.rewriteActionIds.includes(action.id);
                  return (
                    <article key={action.id} className={clsx("rounded-2xl border p-4 transition", checked ? "border-ink/20 bg-white/80" : "border-ink-soft/10 bg-white/35")}>
                      <div className="flex items-start gap-3">
                        <button type="button" onClick={() => toggleAction(action)} className={clsx("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", checked ? "border-ink bg-ink text-white" : "border-ink-soft/30 bg-white")} aria-label={checked ? "取消此调整" : "选择此调整"}>{checked ? <Check size={13} /> : null}</button>
                        <div className="min-w-0 flex-1">
                          {action.type === "switch_version" ? (
                            <><p className="text-sm font-semibold text-ink">切换{DEFAULT_SECTION_LABELS[action.sectionId]}版本</p><div className="mt-2 flex items-center gap-2 text-xs text-ink-muted"><span className="rounded-lg bg-slate-100 px-2 py-1">当前版本</span><ArrowRight size={13} /><span className="rounded-lg bg-blue-50 px-2 py-1 font-medium text-blue-700">{store.sections[action.sectionId].versions.find((item) => item.id === action.toVersionId)?.name ?? "推荐版本"}</span></div></>
                          ) : (
                            <><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-ink">改写{DEFAULT_SECTION_LABELS[action.sectionId]} Bullet</p><button type="button" onClick={() => void retryRewrite(action)} disabled={Boolean(retryingId)} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink disabled:opacity-50"><RefreshCw size={12} className={retryingId === action.id ? "animate-spin" : ""} />换一个</button></div><div className="mt-3 grid gap-2"><div className="rounded-xl bg-red-50/70 px-3 py-2 text-xs leading-relaxed text-slate-600"><span className="mr-2 font-medium text-red-600">原</span>{action.original}</div><div className="rounded-xl bg-emerald-50/80 px-3 py-2 text-xs leading-relaxed text-slate-700"><span className="mr-2 font-medium text-emerald-700">新</span>{action.suggested}</div></div></>
                          )}
                          <p className="mt-2 text-xs leading-relaxed text-ink-muted">{action.reason}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}</div> : <p className="rounded-2xl bg-white/60 p-4 text-sm text-ink-muted">当前版本已能支撑主要要求，暂无必须调整的内容。</p>}
              </section>
              {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            </div>

            <aside className="glass-panel sticky top-24 rounded-3xl p-5">
              <FilePlus2 size={20} className="text-ink" />
              <h2 className="mt-3 font-semibold text-ink">生成新的简历副本</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">保留母版和全部已有版本，仅在新副本中应用所选调整。</p>
              <label className="mt-5 block text-xs font-medium text-ink">新简历名称<input value={outputTitle} onChange={(event) => setOutputTitle(event.target.value)} className="glass-control mt-2 h-10 w-full rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-ink/10" /></label>
              <div className="mt-4 rounded-2xl bg-white/55 p-3 text-xs text-ink-muted"><div className="flex justify-between"><span>推荐调整</span><span>{selectableActions.length} 项</span></div><div className="mt-2 flex justify-between font-medium text-ink"><span>将应用</span><span>{selectedCount} 项</span></div></div>
              <button type="button" onClick={() => void createCopy()} disabled={creating} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-sm font-semibold text-white hover:bg-[#26384a] disabled:opacity-60">{creating ? <Loader2 size={15} className="animate-spin" /> : <FilePlus2 size={15} />}{creating ? "正在创建…" : "创建定制版"}</button>
              <p className="mt-3 text-center text-[11px] text-ink-muted">创建后进入新简历编辑器，可继续手动调整</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
