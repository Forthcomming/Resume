"use client";

import { useRef } from "react";
import { CloudUpload, User } from "lucide-react";
import {
  TextField,
  TextAreaField,
  EntryCard,
  AddButton,
  BulletList,
  TagInput,
} from "./fields";
import { DateRangeField, SelectField } from "./DateRangeField";
import {
  DEGREE_OPTIONS,
  SCHOOL_TAG_OPTIONS,
  STUDY_TYPE_OPTIONS,
} from "@/lib/resume/education-options";
import type { DateDisplayFormat } from "@/lib/resume/date-display";
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

function BasicInfoGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink-soft/10 bg-fog-soft/25 p-4">
      <h3 className="mb-3 text-[13px] font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}

function AvatarField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center">
      <span className="mb-1.5 block w-full text-[12px] font-medium text-ink-soft">
        头像
      </span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mb-2 flex items-center gap-1.5 rounded-full border border-ink-soft/10 bg-white px-3 py-1.5 text-[11px] font-medium text-ink-soft transition-colors hover:border-ink-soft/20 hover:text-ink"
      >
        <CloudUpload size={13} strokeWidth={2} />
        上传头像
      </button>
      <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-2xl border border-ink-soft/10 bg-white">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="头像" className="h-full w-full object-cover" />
        ) : (
          <User size={32} strokeWidth={1.5} className="text-ink-muted/40" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

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
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-3">
          <TextField
            label="姓名"
            value={value.name}
            onChange={(v) => set("name", v)}
            placeholder="小biu"
          />
          <TextField
            label="电话"
            value={value.phone}
            onChange={(v) => set("phone", v)}
            placeholder="13800000000"
          />
          <TextField
            label="邮箱"
            type="email"
            value={value.email}
            onChange={(v) => set("email", v)}
            placeholder="example@offerbiu.com"
          />
          <TextField
            label="年龄"
            value={value.birthday}
            onChange={(v) => set("birthday", v)}
            placeholder="如：26"
          />
        </div>
        <AvatarField value={value.avatar} onChange={(v) => set("avatar", v)} />
      </div>

      <BasicInfoGroup title="求职意向">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="意向城市"
            value={value.target_cities}
            onChange={(v) => set("target_cities", v)}
            placeholder="北京 / 上海 / 深圳"
          />
          <TextField
            label="期望职位"
            value={value.desired_position}
            onChange={(v) => set("desired_position", v)}
            placeholder="产品经理 / 数据分析"
          />
        </div>
      </BasicInfoGroup>

      <BasicInfoGroup title="社交信息">
        <div className="grid grid-cols-3 gap-3">
          <TextField
            label="个人网站"
            value={value.website}
            onChange={(v) => set("website", v)}
            placeholder="作品集 / GitHub"
          />
          <TextField
            label="微信"
            value={value.wechat}
            onChange={(v) => set("wechat", v)}
            placeholder="微信号"
          />
          <TextField
            label="LinkedIn"
            value={value.linkedin}
            onChange={(v) => set("linkedin", v)}
            placeholder="LinkedIn 链接"
          />
        </div>
      </BasicInfoGroup>

      <BasicInfoGroup title="其他信息">
        <div className="grid grid-cols-4 gap-3">
          <TextField
            label="性别"
            value={value.gender}
            onChange={(v) => set("gender", v)}
            placeholder="男"
          />
          <TextField
            label="身高"
            value={value.height}
            onChange={(v) => set("height", v)}
            placeholder="如：175cm"
          />
          <TextField
            label="体重"
            value={value.weight}
            onChange={(v) => set("weight", v)}
            placeholder="如：65kg"
          />
          <TextField
            label="民族"
            value={value.ethnicity}
            onChange={(v) => set("ethnicity", v)}
            placeholder="汉族"
          />
          <TextField
            label="籍贯"
            value={value.native_place}
            onChange={(v) => set("native_place", v)}
            placeholder="如：广东深圳"
          />
          <TextField
            label="政治面貌"
            value={value.political_status}
            onChange={(v) => set("political_status", v)}
            placeholder="如：中共党员"
          />
          <TextField
            label="婚姻状况"
            value={value.marital_status}
            onChange={(v) => set("marital_status", v)}
            placeholder="如：未婚"
          />
          <TextField
            label="现居城市"
            value={value.location}
            onChange={(v) => set("location", v)}
            placeholder="北京"
          />
        </div>
      </BasicInfoGroup>
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
  dateDisplayFormat,
  onDateDisplayFormatChange,
  bulletAIOpen,
  onToggleBulletAI,
}: {
  value: EducationContent;
  onChange: (v: EducationContent) => void;
  dateDisplayFormat?: DateDisplayFormat;
  onDateDisplayFormatChange?: (format: DateDisplayFormat) => void;
  bulletAIOpen?: { entryIndex: number; bulletIndex: number } | null;
  onToggleBulletAI?: (entryIndex: number, bulletIndex: number) => void;
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
            <TextField
              label="学校名称"
              value={e.school}
              onChange={(v) => update(i, { school: v })}
              placeholder="示例大学"
            />
            <SelectField
              label="学校标签"
              value={e.schoolTag}
              onChange={(v) => update(i, { schoolTag: v })}
              options={SCHOOL_TAG_OPTIONS}
            />
            <TextField
              label="专业"
              value={e.major}
              onChange={(v) => update(i, { major: v })}
              placeholder="信息管理与信息系统"
            />
            <TextField
              label="学院"
              value={e.college}
              onChange={(v) => update(i, { college: v })}
              placeholder="管理学院"
            />
            <SelectField
              label="学历"
              value={e.degree}
              onChange={(v) => update(i, { degree: v })}
              options={DEGREE_OPTIONS}
            />
            <SelectField
              label="类型"
              value={e.studyType}
              onChange={(v) => update(i, { studyType: v })}
              options={STUDY_TYPE_OPTIONS}
            />
            <TextField
              label="所在城市"
              value={e.city}
              onChange={(v) => update(i, { city: v })}
              placeholder="请输入所在城市"
            />
            <TextField
              label="GPA"
              value={e.gpa}
              onChange={(v) => update(i, { gpa: v })}
              placeholder="3.8 / 4.0"
            />
            <div className="col-span-2">
              <DateRangeField
                startDate={e.startDate}
                endDate={e.endDate}
                onChange={(startDate, endDate) =>
                  update(i, { startDate, endDate })
                }
                dateDisplayFormat={dateDisplayFormat}
                onDateDisplayFormatChange={onDateDisplayFormatChange}
              />
            </div>
          </div>
          <div className="mt-3">
            <BulletList
              label="荣誉 / 课程"
              bullets={e.notes}
              onChange={(notes) => update(i, { notes })}
              entryIndex={i}
              sectionId="education"
              bulletAIOpen={bulletAIOpen}
              onToggleBulletAI={onToggleBulletAI}
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
  dateDisplayFormat,
  onDateDisplayFormatChange,
  bulletAIOpen,
  onToggleBulletAI,
}: {
  value: WorkExperienceContent;
  onChange: (v: WorkExperienceContent) => void;
  dateDisplayFormat?: DateDisplayFormat;
  onDateDisplayFormatChange?: (format: DateDisplayFormat) => void;
  bulletAIOpen?: { entryIndex: number; bulletIndex: number } | null;
  onToggleBulletAI?: (entryIndex: number, bulletIndex: number) => void;
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
            <div className="col-span-2">
              <DateRangeField
                startDate={e.startDate}
                endDate={e.endDate}
                onChange={(startDate, endDate) =>
                  update(i, { startDate, endDate })
                }
                dateDisplayFormat={dateDisplayFormat}
                onDateDisplayFormatChange={onDateDisplayFormatChange}
              />
            </div>
          </div>
          <div className="mt-3">
            <BulletList
              label="工作内容"
              bullets={e.bullets}
              onChange={(bullets) => update(i, { bullets })}
              entryIndex={i}
              sectionId="work"
              bulletAIOpen={bulletAIOpen}
              onToggleBulletAI={onToggleBulletAI}
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
  dateDisplayFormat,
  onDateDisplayFormatChange,
  bulletAIOpen,
  onToggleBulletAI,
}: {
  value: ProjectContent;
  onChange: (v: ProjectContent) => void;
  dateDisplayFormat?: DateDisplayFormat;
  onDateDisplayFormatChange?: (format: DateDisplayFormat) => void;
  bulletAIOpen?: { entryIndex: number; bulletIndex: number } | null;
  onToggleBulletAI?: (entryIndex: number, bulletIndex: number) => void;
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
            <div className="col-span-2">
              <DateRangeField
                startDate={e.startDate}
                endDate={e.endDate}
                onChange={(startDate, endDate) =>
                  update(i, { startDate, endDate })
                }
                dateDisplayFormat={dateDisplayFormat}
                onDateDisplayFormatChange={onDateDisplayFormatChange}
              />
            </div>
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
              bulletAIOpen={bulletAIOpen}
              onToggleBulletAI={onToggleBulletAI}
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
  dateDisplayFormat,
  onDateDisplayFormatChange,
  bulletAIOpen,
  onToggleBulletAI,
}: {
  sectionId: keyof ResumeContent;
  content: ResumeContent;
  onChange: (next: ResumeContent) => void;
  dateDisplayFormat?: DateDisplayFormat;
  onDateDisplayFormatChange?: (format: DateDisplayFormat) => void;
  bulletAIOpen?: { entryIndex: number; bulletIndex: number } | null;
  onToggleBulletAI?: (entryIndex: number, bulletIndex: number) => void;
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
          dateDisplayFormat={dateDisplayFormat}
          onDateDisplayFormatChange={onDateDisplayFormatChange}
          bulletAIOpen={bulletAIOpen}
          onToggleBulletAI={onToggleBulletAI}
        />
      );
    case "education":
      return (
        <EducationForm
          value={content.education}
          onChange={(v) => onChange({ ...content, education: v })}
          dateDisplayFormat={dateDisplayFormat}
          onDateDisplayFormatChange={onDateDisplayFormatChange}
          bulletAIOpen={bulletAIOpen}
          onToggleBulletAI={onToggleBulletAI}
        />
      );
    case "project":
      return (
        <ProjectForm
          value={content.project}
          onChange={(v) => onChange({ ...content, project: v })}
          dateDisplayFormat={dateDisplayFormat}
          onDateDisplayFormatChange={onDateDisplayFormatChange}
          bulletAIOpen={bulletAIOpen}
          onToggleBulletAI={onToggleBulletAI}
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
