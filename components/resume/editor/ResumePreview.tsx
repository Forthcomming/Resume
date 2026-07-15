import type { ResumeContent } from "@/lib/resume/content";
import {
  DEFAULT_DATE_DISPLAY_FORMAT,
  formatDateRange,
  type DateDisplayFormat,
} from "@/lib/resume/date-display";
import type { BodySectionId, SectionId } from "@/lib/resume/versions";
import {
  DEFAULT_SECTION_LABELS,
  REORDERABLE_SECTION_IDS,
} from "@/lib/resume/versions";

interface ResumePreviewProps {
  title: string;
  content: ResumeContent;
  /** Body section order (basic_info always renders as header). */
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
  const contactLine = [
    basic_info.email,
    basic_info.phone,
    basic_info.birthday,
  ]
    .filter((c) => c.trim())
    .join("　|　");

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
    { label: "性别", value: basic_info.gender },
    { label: "民族", value: basic_info.ethnicity },
    { label: "籍贯", value: basic_info.native_place },
    { label: "政治面貌", value: basic_info.political_status },
    { label: "婚姻状况", value: basic_info.marital_status },
    { label: "身高", value: basic_info.height },
    { label: "体重", value: basic_info.weight },
    { label: "现居城市", value: basic_info.location },
  ]);

  const detailLines = [jobLine, socialLine, otherLine].filter(Boolean);
  const hasHeaderInfo = contactLine || detailLines.length > 0;

  return (
    <>
      {contactLine ? (
        <p className="mt-1.5 text-[11px] leading-[1.4] text-[#444]">{contactLine}</p>
      ) : !hasHeaderInfo ? (
        <p className="mt-1.5 text-[11px] leading-[1.4] text-[#999]">{title}</p>
      ) : null}
      {detailLines.map((line) => (
        <p key={line} className="mt-1 text-[10px] leading-[1.5] text-[#555]">
          {line}
        </p>
      ))}
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-b border-[#111] pb-1 text-[12px] font-bold uppercase tracking-[0.06em]">
      {children}
    </h2>
  );
}

function Bullets({ items }: { items: string[] }) {
  const visible = items.filter((b) => b.trim());
  if (visible.length === 0) return null;
  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] leading-[1.5] text-[#222]">
      {visible.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
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
      <p className="whitespace-pre-wrap text-[11px] leading-[1.5] text-[#222]">
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
      <div className="space-y-3">
        {content.entries.map((e, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12px] font-semibold">
                {e.company}
                {e.title && (
                  <span className="font-normal text-[#444]"> · {e.title}</span>
                )}
              </span>
              <span className="shrink-0 text-[10px] text-[#666]">
                {[dateRange(e.startDate, e.endDate, dateDisplayFormat), e.location]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
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
      <div className="space-y-3">
        {content.entries.map((e, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12px] font-semibold">
                {e.name}
                {e.role && (
                  <span className="font-normal text-[#444]"> · {e.role}</span>
                )}
              </span>
              <span className="shrink-0 text-[10px] text-[#666]">
                {dateRange(e.startDate, e.endDate, dateDisplayFormat)}
              </span>
            </div>
            {e.techStack.length > 0 && (
              <p className="mt-0.5 text-[10px] text-[#666]">
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
      <div className="space-y-3">
        {content.entries.map((e, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="text-[12px] font-semibold">
                  {[e.city, e.school].filter(Boolean).join(" · ")}
                </span>
                {e.schoolTag && (
                  <span className="rounded bg-[#eceff3] px-1.5 py-0.5 text-[9px] font-medium text-[#555]">
                    {e.schoolTag}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-[10px] text-[#666]">
                {dateRange(e.startDate, e.endDate, dateDisplayFormat)}
              </span>
            </div>
            <p className="text-[11px] text-[#444]">
              {[e.degree, e.studyType, e.major, e.college, e.gpa && `GPA ${e.gpa}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <Bullets items={e.notes} />
          </div>
        ))}
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
      <div className="space-y-1">
        {content.categories.map((c, i) => (
          <p key={i} className="text-[11px] leading-[1.5] text-[#222]">
            {c.label && <span className="font-semibold">{c.label}：</span>}
            {c.items.join("、")}
          </p>
        ))}
      </div>
    </section>
  );
}

function BodySection({
  sectionId,
  content,
  sectionTitles,
  dateDisplayFormat,
}: {
  sectionId: BodySectionId;
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

  const bodyOrder = (sectionOrder ?? REORDERABLE_SECTION_IDS).filter(
    (id): id is BodySectionId =>
      id !== "basic_info" &&
      (REORDERABLE_SECTION_IDS as readonly string[]).includes(id)
  );
  const orderedBody: BodySectionId[] = [
    ...bodyOrder,
    ...REORDERABLE_SECTION_IDS.filter((id) => !bodyOrder.includes(id)),
  ];

  const hasAnyBody =
    summary.text.trim() ||
    work.entries.some((e) => e.company || e.title) ||
    project.entries.some((e) => e.name) ||
    education.entries.some((e) => e.school || e.major) ||
    skills.categories.some((c) => c.label || c.items.length > 0);

  return (
    <div className="resume-print-wrapper flex justify-center py-8">
      <div className="w-full max-w-[680px] shrink-0">
        <div
          className="resume-print-root aspect-[210/297] w-full rounded-[4px] bg-white px-[9.5%] py-[6%] text-[#111] shadow-[0_16px_48px_rgba(15,25,36,0.12),0_4px_12px_rgba(15,25,36,0.06)] ring-1 ring-white/80"
          style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
        >
          <header>
            <div className="flex items-start gap-4">
              {basic_info.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={basic_info.avatar}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <h1 className="text-[24px] font-bold leading-tight tracking-tight">
                  {basic_info.name || "你的姓名"}
                </h1>
                <BasicInfoPreviewLines basic_info={basic_info} title={title} />
              </div>
            </div>
          </header>

          <div className="mt-6 space-y-5">
            {orderedBody.map((sectionId) => (
              <BodySection
                key={sectionId}
                sectionId={sectionId}
                content={content}
                sectionTitles={sectionTitles}
                dateDisplayFormat={dateDisplayFormat}
              />
            ))}

            {!hasAnyBody && (
              <p className="text-[11px] italic text-[#bbb]">
                在左侧填写内容后将在此处实时预览
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
