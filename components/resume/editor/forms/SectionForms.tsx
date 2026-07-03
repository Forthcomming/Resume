"use client";

import {
  TextField,
  TextAreaField,
  EntryCard,
  AddButton,
  BulletList,
  TagInput,
} from "./fields";
import type { PendingAIEdit } from "@/types/ai-edit";
import {
  emptyEducationEntry,
  emptyWorkEntry,
  emptyProjectEntry,
  emptySkillCategory,
  type BasicInfoContent,
  type SummaryContent,
  type EducationContent,
  type WorkExperienceContent,
  type ProjectContent,
  type SkillsContent,
  type ResumeContent,
} from "@/lib/resume/content";

function BasicInfoForm({
  value,
  onChange,
}: {
  value: BasicInfoContent;
  onChange: (v: BasicInfoContent) => void;
}) {
  const set = (k: keyof BasicInfoContent, v: string) =>
    onChange({ ...value, [k]: v });
  return (
    <div className="grid grid-cols-2 gap-3">
      <TextField label="姓名" value={value.name} onChange={(v) => set("name", v)} placeholder="张三" />
      <TextField label="所在地" value={value.location} onChange={(v) => set("location", v)} placeholder="北京" />
      <TextField label="邮箱" type="email" value={value.email} onChange={(v) => set("email", v)} placeholder="you@example.com" />
      <TextField label="电话" value={value.phone} onChange={(v) => set("phone", v)} placeholder="138-0000-0000" />
      <TextField label="LinkedIn" value={value.linkedin} onChange={(v) => set("linkedin", v)} placeholder="linkedin.com/in/..." />
      <TextField label="GitHub" value={value.github} onChange={(v) => set("github", v)} placeholder="github.com/..." />
      <div className="col-span-2">
        <TextField label="个人网站" value={value.website} onChange={(v) => set("website", v)} placeholder="https://..." />
      </div>
    </div>
  );
}

function SummaryForm({
  value,
  onChange,
}: {
  value: SummaryContent;
  onChange: (v: SummaryContent) => void;
}) {
  return (
    <TextAreaField
      value={value.text}
      onChange={(text) => onChange({ text })}
      placeholder="一段简短的个人简介 / 核心优势..."
      rows={4}
    />
  );
}

function EducationForm({
  value,
  onChange,
  onBulletAIRequest,
  bulletAIOpen,
  onToggleBulletAI,
  pendingAIEdit,
  onAIAccept,
  onAIReject,
}: {
  value: EducationContent;
  onChange: (v: EducationContent) => void;
  onBulletAIRequest?: (
    entryIndex: number,
    bulletIndex: number,
    instruction: string
  ) => void;
  bulletAIOpen?: { entryIndex: number; bulletIndex: number } | null;
  onToggleBulletAI?: (entryIndex: number, bulletIndex: number) => void;
  pendingAIEdit?: PendingAIEdit | null;
  onAIAccept?: () => void;
  onAIReject?: () => void;
}) {
  const update = (i: number, patch: Partial<EducationContent["entries"][number]>) =>
    onChange({
      entries: value.entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    });
  return (
    <div className="space-y-3">
      {value.entries.map((e, i) => (
        <EntryCard
          key={i}
          label={`教育经历 ${i + 1}`}
          onRemove={() =>
            onChange({ entries: value.entries.filter((_, idx) => idx !== i) })
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <TextField label="学校" value={e.school} onChange={(v) => update(i, { school: v })} placeholder="清华大学" />
            <TextField label="专业" value={e.major} onChange={(v) => update(i, { major: v })} placeholder="计算机科学" />
            <TextField label="学位" value={e.degree} onChange={(v) => update(i, { degree: v })} placeholder="本科 / 硕士" />
            <TextField label="GPA" value={e.gpa} onChange={(v) => update(i, { gpa: v })} placeholder="3.8 / 4.0" />
            <TextField label="开始" value={e.startDate} onChange={(v) => update(i, { startDate: v })} placeholder="2018-09" />
            <TextField label="结束" value={e.endDate} onChange={(v) => update(i, { endDate: v })} placeholder="2022-06 / present" />
          </div>
          <div className="mt-3">
            <BulletList
              label="荣誉 / 课程"
              bullets={e.notes}
              onChange={(notes) => update(i, { notes })}
              entryIndex={i}
              sectionId="education"
              onBulletAIRequest={onBulletAIRequest}
              bulletAIOpen={bulletAIOpen}
              onToggleBulletAI={onToggleBulletAI}
              pendingAIEdit={pendingAIEdit}
              onAIAccept={onAIAccept}
              onAIReject={onAIReject}
            />
          </div>
        </EntryCard>
      ))}
      <AddButton label="添加教育经历" onClick={() => onChange({ entries: [...value.entries, emptyEducationEntry()] })} />
    </div>
  );
}

function WorkExperienceForm({
  value,
  onChange,
  onBulletAIRequest,
  bulletAIOpen,
  onToggleBulletAI,
  pendingAIEdit,
  onAIAccept,
  onAIReject,
}: {
  value: WorkExperienceContent;
  onChange: (v: WorkExperienceContent) => void;
  onBulletAIRequest?: (
    entryIndex: number,
    bulletIndex: number,
    instruction: string
  ) => void;
  bulletAIOpen?: { entryIndex: number; bulletIndex: number } | null;
  onToggleBulletAI?: (entryIndex: number, bulletIndex: number) => void;
  pendingAIEdit?: PendingAIEdit | null;
  onAIAccept?: () => void;
  onAIReject?: () => void;
}) {
  const update = (i: number, patch: Partial<WorkExperienceContent["entries"][number]>) =>
    onChange({
      entries: value.entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    });
  return (
    <div className="space-y-3">
      {value.entries.map((e, i) => (
        <EntryCard
          key={i}
          label={`工作经历 ${i + 1}`}
          onRemove={() =>
            onChange({ entries: value.entries.filter((_, idx) => idx !== i) })
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <TextField label="公司" value={e.company} onChange={(v) => update(i, { company: v })} placeholder="字节跳动" />
            <TextField label="职位" value={e.title} onChange={(v) => update(i, { title: v })} placeholder="产品经理" />
            <TextField label="地点" value={e.location} onChange={(v) => update(i, { location: v })} placeholder="北京" />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="开始" value={e.startDate} onChange={(v) => update(i, { startDate: v })} placeholder="2022-07" />
              <TextField label="结束" value={e.endDate} onChange={(v) => update(i, { endDate: v })} placeholder="present" />
            </div>
          </div>
          <div className="mt-3">
            <BulletList
              label="工作内容"
              bullets={e.bullets}
              onChange={(bullets) => update(i, { bullets })}
              entryIndex={i}
              sectionId="work"
              onBulletAIRequest={onBulletAIRequest}
              bulletAIOpen={bulletAIOpen}
              onToggleBulletAI={onToggleBulletAI}
              pendingAIEdit={pendingAIEdit}
              onAIAccept={onAIAccept}
              onAIReject={onAIReject}
            />
          </div>
        </EntryCard>
      ))}
      <AddButton label="添加工作经历" onClick={() => onChange({ entries: [...value.entries, emptyWorkEntry()] })} />
    </div>
  );
}

function ProjectForm({
  value,
  onChange,
  onBulletAIRequest,
  bulletAIOpen,
  onToggleBulletAI,
  pendingAIEdit,
  onAIAccept,
  onAIReject,
}: {
  value: ProjectContent;
  onChange: (v: ProjectContent) => void;
  onBulletAIRequest?: (
    entryIndex: number,
    bulletIndex: number,
    instruction: string
  ) => void;
  bulletAIOpen?: { entryIndex: number; bulletIndex: number } | null;
  onToggleBulletAI?: (entryIndex: number, bulletIndex: number) => void;
  pendingAIEdit?: PendingAIEdit | null;
  onAIAccept?: () => void;
  onAIReject?: () => void;
}) {
  const update = (i: number, patch: Partial<ProjectContent["entries"][number]>) =>
    onChange({
      entries: value.entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    });
  return (
    <div className="space-y-3">
      {value.entries.map((e, i) => (
        <EntryCard
          key={i}
          label={`项目经历 ${i + 1}`}
          onRemove={() =>
            onChange({ entries: value.entries.filter((_, idx) => idx !== i) })
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <TextField label="项目名称" value={e.name} onChange={(v) => update(i, { name: v })} placeholder="ResumeKit" />
            <TextField label="角色" value={e.role} onChange={(v) => update(i, { role: v })} placeholder="负责人 / 核心开发" />
            <TextField label="开始" value={e.startDate} onChange={(v) => update(i, { startDate: v })} placeholder="2023-01" />
            <TextField label="结束" value={e.endDate} onChange={(v) => update(i, { endDate: v })} placeholder="2023-06" />
            <div className="col-span-2">
              <TextField label="链接" value={e.link} onChange={(v) => update(i, { link: v })} placeholder="https://..." />
            </div>
          </div>
          <div className="mt-3">
            <TagInput label="技术栈" tags={e.techStack} onChange={(techStack) => update(i, { techStack })} placeholder="如 React，回车添加" />
          </div>
          <div className="mt-3">
            <BulletList
              label="项目描述"
              bullets={e.bullets}
              onChange={(bullets) => update(i, { bullets })}
              entryIndex={i}
              sectionId="project"
              onBulletAIRequest={onBulletAIRequest}
              bulletAIOpen={bulletAIOpen}
              onToggleBulletAI={onToggleBulletAI}
              pendingAIEdit={pendingAIEdit}
              onAIAccept={onAIAccept}
              onAIReject={onAIReject}
            />
          </div>
        </EntryCard>
      ))}
      <AddButton label="添加项目经历" onClick={() => onChange({ entries: [...value.entries, emptyProjectEntry()] })} />
    </div>
  );
}

function SkillsForm({
  value,
  onChange,
}: {
  value: SkillsContent;
  onChange: (v: SkillsContent) => void;
}) {
  const update = (i: number, patch: Partial<SkillsContent["categories"][number]>) =>
    onChange({
      categories: value.categories.map((c, idx) =>
        idx === i ? { ...c, ...patch } : c
      ),
    });
  return (
    <div className="space-y-3">
      {value.categories.map((c, i) => (
        <EntryCard
          key={i}
          label={`技能分类 ${i + 1}`}
          onRemove={() =>
            onChange({
              categories: value.categories.filter((_, idx) => idx !== i),
            })
          }
        >
          <div className="space-y-3">
            <TextField label="分类名称" value={c.label} onChange={(v) => update(i, { label: v })} placeholder="如：编程语言 / 工具" />
            <TagInput label="技能项" tags={c.items} onChange={(items) => update(i, { items })} placeholder="输入技能后回车" />
          </div>
        </EntryCard>
      ))}
      <AddButton label="添加技能分类" onClick={() => onChange({ categories: [...value.categories, emptySkillCategory()] })} />
    </div>
  );
}

export function SectionForm({
  sectionId,
  content,
  onChange,
  onBulletAIRequest,
  bulletAIOpen,
  onToggleBulletAI,
  pendingAIEdit,
  onAIAccept,
  onAIReject,
}: {
  sectionId: keyof ResumeContent;
  content: ResumeContent;
  onChange: (next: ResumeContent) => void;
  onBulletAIRequest?: (
    entryIndex: number,
    bulletIndex: number,
    instruction: string
  ) => void;
  bulletAIOpen?: { entryIndex: number; bulletIndex: number } | null;
  onToggleBulletAI?: (entryIndex: number, bulletIndex: number) => void;
  pendingAIEdit?: PendingAIEdit | null;
  onAIAccept?: () => void;
  onAIReject?: () => void;
}) {
  switch (sectionId) {
    case "basic_info":
      return (
        <BasicInfoForm
          value={content.basic_info}
          onChange={(v) => onChange({ ...content, basic_info: v })}
        />
      );
    case "summary":
      return (
        <SummaryForm
          value={content.summary}
          onChange={(v) => onChange({ ...content, summary: v })}
        />
      );
    case "work":
      return (
        <WorkExperienceForm
          value={content.work}
          onChange={(v) => onChange({ ...content, work: v })}
          onBulletAIRequest={onBulletAIRequest}
          bulletAIOpen={bulletAIOpen}
          onToggleBulletAI={onToggleBulletAI}
          pendingAIEdit={pendingAIEdit}
          onAIAccept={onAIAccept}
          onAIReject={onAIReject}
        />
      );
    case "education":
      return (
        <EducationForm
          value={content.education}
          onChange={(v) => onChange({ ...content, education: v })}
          onBulletAIRequest={onBulletAIRequest}
          bulletAIOpen={bulletAIOpen}
          onToggleBulletAI={onToggleBulletAI}
          pendingAIEdit={pendingAIEdit}
          onAIAccept={onAIAccept}
          onAIReject={onAIReject}
        />
      );
    case "project":
      return (
        <ProjectForm
          value={content.project}
          onChange={(v) => onChange({ ...content, project: v })}
          onBulletAIRequest={onBulletAIRequest}
          bulletAIOpen={bulletAIOpen}
          onToggleBulletAI={onToggleBulletAI}
          pendingAIEdit={pendingAIEdit}
          onAIAccept={onAIAccept}
          onAIReject={onAIReject}
        />
      );
    case "skills":
      return (
        <SkillsForm
          value={content.skills}
          onChange={(v) => onChange({ ...content, skills: v })}
        />
      );
    default:
      return null;
  }
}
