"use client";

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ResumeContent } from "@/lib/resume/content";
import { A4_HEIGHT_CSS, A4_WIDTH_CSS } from "@/lib/resume/a4";
import {
  DEFAULT_DATE_DISPLAY_FORMAT,
  formatDateRange,
  type DateDisplayFormat,
} from "@/lib/resume/date-display";
import { resumeStyleCssVars } from "@/lib/resume/density";
import type { SectionId } from "@/lib/resume/versions";
import {
  DEFAULT_SECTION_LABELS,
  SECTION_IDS,
} from "@/lib/resume/versions";

interface ResumePreviewProps {
  title: string;
  content: ResumeContent;
  /** Full section order including basic_info. */
  sectionOrder?: SectionId[];
  sectionTitles?: Partial<Record<SectionId, string>>;
  dateDisplayFormat?: DateDisplayFormat;
}

function resolveSectionTitle(
  sectionId: SectionId,
  sectionTitles?: Partial<Record<SectionId, string>>
): string {
  return (
    sectionTitles?.[sectionId]?.trim() || DEFAULT_SECTION_LABELS[sectionId]
  );
}

function dateRange(
  start: string,
  end: string,
  format: DateDisplayFormat = DEFAULT_DATE_DISPLAY_FORMAT
): string {
  return formatDateRange(start, end, format);
}

function labeledLine(
  items: { label: string; value: string }[],
  separator = "　|　"
): string {
  return items
    .filter((item) => item.value.trim())
    .map((item) => `${item.label}：${item.value.trim()}`)
    .join(separator);
}

function BasicInfoPreviewLines({
  basic_info,
  title,
}: {
  basic_info: ResumeContent["basic_info"];
  title: string;
}) {
  const contactLine = [basic_info.phone, basic_info.email]
    .filter((c) => c.trim())
    .join(" | ");

  const jobLine = labeledLine([
    { label: "意向城市", value: basic_info.target_cities },
    { label: "期望职位", value: basic_info.desired_position },
  ]);

  const socialLine = labeledLine([
    { label: "个人网站", value: basic_info.website },
    { label: "微信", value: basic_info.wechat },
    { label: "LinkedIn", value: basic_info.linkedin },
    { label: "GitHub", value: basic_info.github },
  ]);

  const otherLine = labeledLine([
    { label: "年龄", value: basic_info.birthday },
    { label: "所在地", value: basic_info.location },
    { label: "性别", value: basic_info.gender },
    { label: "民族", value: basic_info.ethnicity },
    { label: "籍贯", value: basic_info.native_place },
    { label: "政治面貌", value: basic_info.political_status },
    { label: "婚姻状况", value: basic_info.marital_status },
    { label: "身高", value: basic_info.height },
    { label: "体重", value: basic_info.weight },
  ]);

  const detailLines = [jobLine, socialLine, otherLine].filter(Boolean);
  const hasHeaderInfo = contactLine || detailLines.length > 0;

  return (
    <>
      {contactLine ? (
        <p className="mt-[var(--resume-header-gap)] text-center text-[length:var(--resume-body-size)] leading-[var(--resume-leading)] text-[#333]">
          {contactLine}
        </p>
      ) : !hasHeaderInfo ? (
        <p className="mt-[var(--resume-header-gap)] text-center text-[length:var(--resume-body-size)] leading-[var(--resume-leading)] text-[#999]">
          {title}
        </p>
      ) : null}
      {detailLines.map((line) => (
        <p
          key={line}
          className="mt-[calc(var(--resume-header-gap)*0.75)] text-center text-[length:var(--resume-meta-size)] leading-[var(--resume-leading)] text-[#555]"
        >
          {line}
        </p>
      ))}
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-[var(--resume-section-title-mb)] border-b border-[#111] pb-0.5 text-[length:var(--resume-section-title-size)] font-bold leading-tight text-[#111]">
      {children}
    </h2>
  );
}

function Bullets({ items }: { items: string[] }) {
  const visible = items.filter((b) => b.trim());
  if (visible.length === 0) return null;
  return (
    <ul className="mt-0.5 list-disc space-y-[0.12rem] pl-[1.1em] text-[length:var(--resume-body-size)] leading-[var(--resume-leading)] text-[#222]">
      {visible.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  );
}

/** Campus three-column meta: left org · center role · right dates. */
function EntryMetaRow({
  left,
  center,
  right,
}: {
  left: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.95fr)] items-baseline gap-x-2">
      <div className="min-w-0 text-[length:var(--resume-entry-title-size)] font-semibold leading-snug text-[#111]">
        {left}
      </div>
      <div className="min-w-0 text-center text-[length:var(--resume-body-size)] leading-snug text-[#333]">
        {center}
      </div>
      <div className="min-w-0 text-right text-[length:var(--resume-meta-size)] leading-snug text-[#555]">
        {right}
      </div>
    </div>
  );
}

function SummaryBlock({
  content,
  title,
}: {
  content: ResumeContent["summary"];
  title: string;
}) {
  if (!content.text.trim()) return null;
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <p className="whitespace-pre-wrap text-[length:var(--resume-body-size)] leading-[var(--resume-leading)] text-[#222]">
        {content.text}
      </p>
    </section>
  );
}

function WorkBlock({
  content,
  title,
  dateDisplayFormat,
}: {
  content: ResumeContent["work"];
  title: string;
  dateDisplayFormat: DateDisplayFormat;
}) {
  const hasWork = content.entries.some((e) => e.company || e.title);
  if (!hasWork) return null;
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="flex flex-col gap-[var(--resume-entry-gap)]">
        {content.entries.map((e, i) => (
          <div key={i}>
            <EntryMetaRow
              left={e.company || "—"}
              center={e.title}
              right={[
                dateRange(e.startDate, e.endDate, dateDisplayFormat),
                e.location,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
            <Bullets items={e.bullets} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectBlock({
  content,
  title,
  dateDisplayFormat,
}: {
  content: ResumeContent["project"];
  title: string;
  dateDisplayFormat: DateDisplayFormat;
}) {
  const hasProject = content.entries.some((e) => e.name);
  if (!hasProject) return null;
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="flex flex-col gap-[var(--resume-entry-gap)]">
        {content.entries.map((e, i) => (
          <div key={i}>
            <EntryMetaRow
              left={e.name || "—"}
              center={e.role}
              right={dateRange(e.startDate, e.endDate, dateDisplayFormat)}
            />
            {e.techStack.length > 0 && (
              <p className="mt-0.5 text-[length:var(--resume-meta-size)] text-[#666]">
                {e.techStack.join(" / ")}
              </p>
            )}
            <Bullets items={e.bullets} />
          </div>
        ))}
      </div>
    </section>
  );
}

function EducationBlock({
  content,
  title,
  dateDisplayFormat,
}: {
  content: ResumeContent["education"];
  title: string;
  dateDisplayFormat: DateDisplayFormat;
}) {
  const hasEdu = content.entries.some((e) => e.school || e.major);
  if (!hasEdu) return null;
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="flex flex-col gap-[var(--resume-entry-gap)]">
        {content.entries.map((e, i) => {
          const schoolLabel = [e.school, e.city].filter(Boolean).join(" · ");
          const centerLabel = [e.degree, e.studyType, e.major, e.college]
            .filter(Boolean)
            .join(" · ");
          return (
            <div key={i}>
              <EntryMetaRow
                left={
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <span>{schoolLabel || "—"}</span>
                    {e.schoolTag ? (
                      <span className="rounded bg-[#eceff3] px-1.5 py-0.5 text-[9px] font-medium text-[#555]">
                        {e.schoolTag}
                      </span>
                    ) : null}
                  </span>
                }
                center={centerLabel}
                right={dateRange(e.startDate, e.endDate, dateDisplayFormat)}
              />
              {e.gpa ? (
                <p className="mt-0.5 text-[length:var(--resume-body-size)] text-[#444]">
                  GPA {e.gpa}
                </p>
              ) : null}
              <Bullets items={e.notes} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SkillsBlock({
  content,
  title,
}: {
  content: ResumeContent["skills"];
  title: string;
}) {
  const hasSkills = content.categories.some(
    (c) => c.label || c.items.length > 0
  );
  if (!hasSkills) return null;
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="flex flex-col gap-1">
        {content.categories.map((c, i) => (
          <p
            key={i}
            className="text-[length:var(--resume-body-size)] leading-[var(--resume-leading)] text-[#222]"
          >
            {c.label && <span className="font-semibold">{c.label}：</span>}
            {c.items.join("、")}
          </p>
        ))}
      </div>
    </section>
  );
}

function BasicInfoHeader({
  basic_info,
  title,
}: {
  basic_info: ResumeContent["basic_info"];
  title: string;
}) {
  const hasAvatar = Boolean(basic_info.avatar?.trim());

  return (
    <header className="relative">
      {hasAvatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={basic_info.avatar}
          alt=""
          className="absolute right-0 top-0 z-[1] h-[var(--resume-avatar-h)] w-[var(--resume-avatar-w)] object-cover"
        />
      ) : null}
      <div>
        <h1 className="text-center text-[length:var(--resume-name-size)] font-bold leading-tight tracking-tight text-[#111]">
          {basic_info.name || "你的姓名"}
        </h1>
        <BasicInfoPreviewLines basic_info={basic_info} title={title} />
      </div>
    </header>
  );
}

function BodySection({
  sectionId,
  content,
  sectionTitles,
  dateDisplayFormat,
}: {
  sectionId: Exclude<SectionId, "basic_info">;
  content: ResumeContent;
  sectionTitles?: Partial<Record<SectionId, string>>;
  dateDisplayFormat: DateDisplayFormat;
}) {
  const title = resolveSectionTitle(sectionId, sectionTitles);
  switch (sectionId) {
    case "summary":
      return <SummaryBlock content={content.summary} title={title} />;
    case "work":
      return (
        <WorkBlock
          content={content.work}
          title={title}
          dateDisplayFormat={dateDisplayFormat}
        />
      );
    case "project":
      return (
        <ProjectBlock
          content={content.project}
          title={title}
          dateDisplayFormat={dateDisplayFormat}
        />
      );
    case "education":
      return (
        <EducationBlock
          content={content.education}
          title={title}
          dateDisplayFormat={dateDisplayFormat}
        />
      );
    case "skills":
      return <SkillsBlock content={content.skills} title={title} />;
    default:
      return null;
  }
}

export function ResumePreview({
  title,
  content,
  sectionOrder,
  sectionTitles,
  dateDisplayFormat = DEFAULT_DATE_DISPLAY_FORMAT,
}: ResumePreviewProps) {
  const { basic_info, summary, work, education, project, skills } = content;
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [pageHeightPx, setPageHeightPx] = useState(0);

  const ordered = useMemo(() => {
    const seen = new Set<SectionId>();
    const next: SectionId[] = [];
    for (const id of sectionOrder ?? SECTION_IDS) {
      if ((SECTION_IDS as readonly string[]).includes(id) && !seen.has(id)) {
        seen.add(id);
        next.push(id);
      }
    }
    for (const id of SECTION_IDS) {
      if (!seen.has(id)) next.push(id);
    }
    return next;
  }, [sectionOrder]);

  const hasAnyBody =
    summary.text.trim() ||
    work.entries.some((e) => e.company || e.title) ||
    project.entries.some((e) => e.name) ||
    education.entries.some((e) => e.school || e.major) ||
    skills.categories.some((c) => c.label || c.items.length > 0);

  const styleVars = resumeStyleCssVars();

  const sheetStyle = {
    fontFamily: "var(--resume-font-family)" as const,
    fontKerning: "normal" as const,
    textRendering: "optimizeLegibility" as const,
    width: A4_WIDTH_CSS,
    ...styleVars,
  };

  const body = (
    <div className="flex flex-col gap-[var(--resume-section-gap)]">
      {ordered.map((sectionId) =>
        sectionId === "basic_info" ? (
          <BasicInfoHeader
            key={sectionId}
            basic_info={basic_info}
            title={title}
          />
        ) : (
          <BodySection
            key={sectionId}
            sectionId={sectionId}
            content={content}
            sectionTitles={sectionTitles}
            dateDisplayFormat={dateDisplayFormat}
          />
        )
      )}

      {!hasAnyBody && (
        <p className="text-[length:var(--resume-body-size)] italic text-[#bbb]">
          在左侧填写内容后将在此处实时预览
        </p>
      )}
    </div>
  );

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const measure = () => {
      const probe = el.parentElement?.querySelector(
        "[data-a4-page-probe]"
      ) as HTMLElement | null;
      const pageH = probe?.getBoundingClientRect().height || 1;
      setPageHeightPx(pageH);
      setPageCount(Math.max(1, Math.ceil(el.scrollHeight / pageH - 1e-6)));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ordered, content, title, sectionTitles, dateDisplayFormat]);

  return (
    <div className="resume-print-wrapper relative flex flex-col items-center gap-6 py-8">
      {/* Off-screen full document: measure + PDF export source. */}
      <div className="pointer-events-none fixed -left-[200vw] top-0" aria-hidden>
        <div
          data-a4-page-probe
          style={{ width: A4_WIDTH_CSS, height: A4_HEIGHT_CSS }}
        />
        <div
          ref={measureRef}
          data-resume-pdf-root
          className="resume-print-root bg-white px-[var(--resume-pad-x)] py-[var(--resume-pad-y)] text-[#111]"
          style={sheetStyle}
        >
          {body}
        </div>
      </div>

      {Array.from({ length: pageCount }, (_, pageIndex) => (
        <div
          key={pageIndex}
          className="relative shrink-0 overflow-hidden rounded-[4px] bg-white shadow-[0_16px_48px_rgba(15,25,36,0.12),0_4px_12px_rgba(15,25,36,0.06)] ring-1 ring-white/80"
          style={{
            width: A4_WIDTH_CSS,
            height: A4_HEIGHT_CSS,
          }}
        >
          <div
            className="px-[var(--resume-pad-x)] py-[var(--resume-pad-y)] text-[#111]"
            style={{
              ...sheetStyle,
              transform:
                pageHeightPx > 0
                  ? `translateY(-${pageIndex * pageHeightPx}px)`
                  : undefined,
            }}
          >
            {body}
          </div>
        </div>
      ))}
    </div>
  );
}
