import type { ResumeContent } from "@/lib/resume/content";

interface ResumePreviewProps {
  title: string;
  content: ResumeContent;
}

function dateRange(start: string, end: string): string {
  const s = start.trim();
  const e = end.trim();
  if (!s && !e) return "";
  const right = e === "present" ? "至今" : e;
  return [s, right].filter(Boolean).join(" – ");
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

export function ResumePreview({ title, content }: ResumePreviewProps) {
  const { basic_info, summary, work, education, project, skills } = content;

  const contacts = [
    basic_info.email,
    basic_info.phone,
    basic_info.location,
    basic_info.linkedin,
    basic_info.github,
    basic_info.website,
  ].filter((c) => c.trim());

  const hasWork = work.entries.some((e) => e.company || e.title);
  const hasEdu = education.entries.some((e) => e.school || e.major);
  const hasProject = project.entries.some((e) => e.name);
  const hasSkills = skills.categories.some(
    (c) => c.label || c.items.length > 0
  );

  return (
    <div className="resume-print-wrapper flex justify-center py-6">
      <div className="w-full max-w-[680px] shrink-0">
        <div
          className="resume-print-root aspect-[210/297] w-full bg-white px-[9.5%] py-[6%] text-[#111] shadow-[0_8px_40px_rgba(15,25,36,0.16)]"
          style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
        >
          {/* Header */}
          <header>
            <h1 className="text-[24px] font-bold leading-tight tracking-tight">
              {basic_info.name || "你的姓名"}
            </h1>
            {contacts.length > 0 ? (
              <p className="mt-1.5 text-[11px] leading-[1.4] text-[#444]">
                {contacts.join("　|　")}
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] leading-[1.4] text-[#999]">
                {title}
              </p>
            )}
          </header>

          <div className="mt-6 space-y-5">
            {/* Summary */}
            {summary.text.trim() && (
              <section>
                <SectionTitle>个人简介</SectionTitle>
                <p className="whitespace-pre-wrap text-[11px] leading-[1.5] text-[#222]">
                  {summary.text}
                </p>
              </section>
            )}

            {/* Work */}
            {hasWork && (
              <section>
                <SectionTitle>工作经历</SectionTitle>
                <div className="space-y-3">
                  {work.entries.map((e, i) => (
                    <div key={i}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[12px] font-semibold">
                          {e.company}
                          {e.title && (
                            <span className="font-normal text-[#444]">
                              {" "}
                              · {e.title}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-[10px] text-[#666]">
                          {[dateRange(e.startDate, e.endDate), e.location]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                      <Bullets items={e.bullets} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Project */}
            {hasProject && (
              <section>
                <SectionTitle>项目经历</SectionTitle>
                <div className="space-y-3">
                  {project.entries.map((e, i) => (
                    <div key={i}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[12px] font-semibold">
                          {e.name}
                          {e.role && (
                            <span className="font-normal text-[#444]">
                              {" "}
                              · {e.role}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-[10px] text-[#666]">
                          {dateRange(e.startDate, e.endDate)}
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
            )}

            {/* Education */}
            {hasEdu && (
              <section>
                <SectionTitle>教育经历</SectionTitle>
                <div className="space-y-3">
                  {education.entries.map((e, i) => (
                    <div key={i}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[12px] font-semibold">
                          {e.school}
                        </span>
                        <span className="shrink-0 text-[10px] text-[#666]">
                          {dateRange(e.startDate, e.endDate)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#444]">
                        {[e.degree, e.major, e.gpa && `GPA ${e.gpa}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <Bullets items={e.notes} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills */}
            {hasSkills && (
              <section>
                <SectionTitle>技能</SectionTitle>
                <div className="space-y-1">
                  {skills.categories.map((c, i) => (
                    <p key={i} className="text-[11px] leading-[1.5] text-[#222]">
                      {c.label && (
                        <span className="font-semibold">{c.label}：</span>
                      )}
                      {c.items.join("、")}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {!summary.text.trim() &&
              !hasWork &&
              !hasProject &&
              !hasEdu &&
              !hasSkills && (
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
