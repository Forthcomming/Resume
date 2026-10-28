"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { BulletList, TagInput, TextField } from "./forms/fields";
import { DateRangeField } from "./forms/DateRangeField";
import { SectionVersionModal } from "./SectionVersionModal";
import { SectionVersionPicker } from "./SectionVersionPicker";
import { EditableSectionTitle } from "./EditableSectionTitle";
import type { DateDisplayFormat } from "@/lib/resume/date-display";
import {
  addEntryModule,
  addEntryVersion,
  deleteEntryModule,
  deleteEntryVersion,
  duplicateEntryVersion,
  renameEntryVersion,
  reorderEntryModules,
  setActiveEntryVersion,
  setEntryEnabled,
  updateActiveEntryVersionContent,
  updateEntryFacts,
  type EntrySectionId,
  type ProjectEntryFacts,
  type ProjectEntryVariant,
  type SectionSubVersionsStore,
  type WorkEntryFacts,
  type WorkEntryVariant,
} from "@/lib/resume/versions";
import type { EditTarget } from "@/types/ai-edit";

export function ModularExperienceSection({
  sectionId,
  title,
  defaultTitle,
  onTitleChange,
  store,
  updateStore,
  dateDisplayFormat,
  onDateDisplayFormatChange,
  bulletAIOpen,
  onToggleBulletAI,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  sectionId: EntrySectionId;
  title: string;
  defaultTitle: string;
  onTitleChange: (title: string) => void;
  store: SectionSubVersionsStore;
  updateStore: (updater: (value: SectionSubVersionsStore) => SectionSubVersionsStore) => void;
  dateDisplayFormat: DateDisplayFormat;
  onDateDisplayFormatChange: (format: DateDisplayFormat) => void;
  bulletAIOpen: Extract<EditTarget, { scope: "bullet" }> | null;
  onToggleBulletAI: (target: Extract<EditTarget, { scope: "bullet" }>) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const section = store.entrySections[sectionId];
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragReadyId, setDragReadyId] = useState<string | null>(null);
  const [expandedHidden, setExpandedHidden] = useState<Record<string, boolean>>({});
  const [manageId, setManageId] = useState<string | null>(null);

  return (
    <div className="glass-panel overflow-hidden rounded-[18px]">
      <div className="flex items-center gap-2 border-b border-fog-soft/80 px-5 py-3.5">
        <button type="button" aria-label="上移板块" disabled={!canMoveUp} onClick={onMoveUp} className="flex h-8 w-8 items-center justify-center rounded-xl text-ink-muted hover:bg-fog-soft disabled:opacity-30"><ChevronUp size={16} /></button>
        <button type="button" aria-label="下移板块" disabled={!canMoveDown} onClick={onMoveDown} className="flex h-8 w-8 items-center justify-center rounded-xl text-ink-muted hover:bg-fog-soft disabled:opacity-30"><ChevronDown size={16} /></button>
        <EditableSectionTitle value={title} defaultValue={defaultTitle} onChange={onTitleChange} />
        <span className="ml-auto text-[11px] text-ink-muted">{section.order.filter((id) => section.entries[id]?.enabled).length} 段已启用</span>
      </div>
      <div className="space-y-3 px-5 py-5">
        {section.order.map((entryId, index) => {
          const entry = section.entries[entryId];
          if (!entry) return null;
          const active = entry.versions.find((item) => item.id === entry.activeVersionId) ?? entry.versions[0];
          if (!active) return null;
          const hiddenCollapsed = !entry.enabled && !expandedHidden[entryId];
          const label = sectionId === "work"
            ? ((entry.facts as WorkEntryFacts).company || `工作经历 ${index + 1}`)
            : ((entry.facts as ProjectEntryFacts).name || `项目经历 ${index + 1}`);
          return (
            <div
              key={entryId}
              draggable={dragReadyId === entryId}
              onDragStart={() => setDragging(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragging !== null) updateStore((value) => reorderEntryModules(value, sectionId, dragging, index));
                setDragging(null);
                setDragReadyId(null);
              }}
              onDragEnd={() => {
                setDragging(null);
                setDragReadyId(null);
              }}
              className={clsx("rounded-2xl border border-ink-soft/10 bg-fog-soft/40 p-4 transition", !entry.enabled && "opacity-65", dragging === index && "opacity-40")}
            >
              <div className={clsx("flex items-center gap-2", !hiddenCollapsed && "mb-3")}>
                <button
                  type="button"
                  aria-label={`拖动排序${label}`}
                  onMouseDown={() => setDragReadyId(entryId)}
                  onMouseUp={() => setDragReadyId(null)}
                  onBlur={() => setDragReadyId(null)}
                  className="flex h-8 w-6 cursor-grab items-center justify-center text-ink-muted active:cursor-grabbing"
                >
                  <GripVertical size={14} />
                </button>
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">{label}</span>
                <SectionVersionPicker versions={entry.versions} activeVersionId={entry.activeVersionId} onChange={(versionId) => updateStore((value) => setActiveEntryVersion(value, sectionId, entryId, versionId))} onManageVersions={() => setManageId(entryId)} />
                <button type="button" onClick={() => updateStore((value) => setEntryEnabled(value, sectionId, entryId, !entry.enabled))} className="flex h-8 items-center gap-1 rounded-full px-2 text-[11px] text-ink-muted hover:bg-white" title={entry.enabled ? "从当前简历隐藏" : "用于当前简历"}>
                  {entry.enabled ? <Eye size={14} /> : <EyeOff size={14} />}{entry.enabled ? "已启用" : "已隐藏"}
                </button>
                {!entry.enabled ? <button type="button" aria-label="展开隐藏经历" onClick={() => setExpandedHidden((current) => ({ ...current, [entryId]: !current[entryId] }))} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-white">{hiddenCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</button> : null}
                <button type="button" aria-label="删除经历" onClick={() => { if (window.confirm(`确定删除「${label}」及其全部版本？`)) updateStore((value) => deleteEntryModule(value, sectionId, entryId)); }} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button>
              </div>

              {!hiddenCollapsed && sectionId === "work" ? (
                <WorkFields facts={entry.facts as WorkEntryFacts} variant={active.content as WorkEntryVariant} onFacts={(facts) => updateStore((value) => updateEntryFacts(value, "work", entryId, facts))} onVariant={(variant) => updateStore((value) => updateActiveEntryVersionContent(value, "work", entryId, variant))} dateDisplayFormat={dateDisplayFormat} onDateDisplayFormatChange={onDateDisplayFormatChange} bulletAIOpen={bulletAIOpen && "entryId" in bulletAIOpen && bulletAIOpen.entryId === entryId ? bulletAIOpen : null} onToggleBulletAI={(bulletIndex) => onToggleBulletAI({ scope: "bullet", sectionId: "work", entryId, entryVersionId: active.id, bulletIndex })} />
              ) : null}
              {!hiddenCollapsed && sectionId === "project" ? (
                <ProjectFields facts={entry.facts as ProjectEntryFacts} variant={active.content as ProjectEntryVariant} onFacts={(facts) => updateStore((value) => updateEntryFacts(value, "project", entryId, facts))} onVariant={(variant) => updateStore((value) => updateActiveEntryVersionContent(value, "project", entryId, variant))} dateDisplayFormat={dateDisplayFormat} onDateDisplayFormatChange={onDateDisplayFormatChange} bulletAIOpen={bulletAIOpen && "entryId" in bulletAIOpen && bulletAIOpen.entryId === entryId ? bulletAIOpen : null} onToggleBulletAI={(bulletIndex) => onToggleBulletAI({ scope: "bullet", sectionId: "project", entryId, entryVersionId: active.id, bulletIndex })} />
              ) : null}

              <SectionVersionModal open={manageId === entryId} sectionTitle={label} versions={entry.versions} activeVersionId={entry.activeVersionId} onActiveVersionChange={(versionId) => updateStore((value) => setActiveEntryVersion(value, sectionId, entryId, versionId))} onCreateSubVersion={(name) => updateStore((value) => addEntryVersion(value, sectionId, entryId, name))} onRenameSubVersion={(versionId, name) => updateStore((value) => renameEntryVersion(value, sectionId, entryId, versionId, name))} onDuplicateSubVersion={(versionId) => updateStore((value) => duplicateEntryVersion(value, sectionId, entryId, versionId))} onDeleteSubVersion={(versionId) => updateStore((value) => deleteEntryVersion(value, sectionId, entryId, versionId))} onClose={() => setManageId(null)} />
            </div>
          );
        })}
        <button type="button" onClick={() => updateStore((value) => addEntryModule(value, sectionId))} className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-ink-soft/20 py-2.5 text-[12px] text-ink-soft hover:bg-white/60 hover:text-ink"><Plus size={14} />添加{sectionId === "work" ? "工作" : "项目"}经历</button>
      </div>
    </div>
  );
}

function WorkFields({ facts, variant, onFacts, onVariant, dateDisplayFormat, onDateDisplayFormatChange, bulletAIOpen, onToggleBulletAI }: { facts: WorkEntryFacts; variant: WorkEntryVariant; onFacts: (value: WorkEntryFacts) => void; onVariant: (value: WorkEntryVariant) => void; dateDisplayFormat: DateDisplayFormat; onDateDisplayFormatChange: (value: DateDisplayFormat) => void; bulletAIOpen: Extract<EditTarget, { scope: "bullet" }> | null; onToggleBulletAI: (index: number) => void }) {
  return <><div className="grid grid-cols-2 gap-3"><TextField label="公司" value={facts.company} onChange={(company) => onFacts({ ...facts, company })} /><TextField label="职位" value={variant.title} onChange={(title) => onVariant({ ...variant, title })} /><TextField label="工作地点" value={facts.location} onChange={(location) => onFacts({ ...facts, location })} /><div className="col-span-2"><DateRangeField startDate={facts.startDate} endDate={facts.endDate} onChange={(startDate, endDate) => onFacts({ ...facts, startDate, endDate })} dateDisplayFormat={dateDisplayFormat} onDateDisplayFormatChange={onDateDisplayFormatChange} /></div></div><div className="mt-3"><BulletList label="工作内容" bullets={variant.bullets} onChange={(bullets) => onVariant({ ...variant, bullets })} bulletAIOpen={"entryId" in (bulletAIOpen ?? {}) ? { entryIndex: 0, bulletIndex: bulletAIOpen?.bulletIndex ?? -1 } : null} entryIndex={0} sectionId="work" onToggleBulletAI={(_, bulletIndex) => onToggleBulletAI(bulletIndex)} /></div></>;
}

function ProjectFields({ facts, variant, onFacts, onVariant, dateDisplayFormat, onDateDisplayFormatChange, bulletAIOpen, onToggleBulletAI }: { facts: ProjectEntryFacts; variant: ProjectEntryVariant; onFacts: (value: ProjectEntryFacts) => void; onVariant: (value: ProjectEntryVariant) => void; dateDisplayFormat: DateDisplayFormat; onDateDisplayFormatChange: (value: DateDisplayFormat) => void; bulletAIOpen: Extract<EditTarget, { scope: "bullet" }> | null; onToggleBulletAI: (index: number) => void }) {
  return <><div className="grid grid-cols-2 gap-3"><TextField label="项目名称" value={facts.name} onChange={(name) => onFacts({ ...facts, name })} /><TextField label="角色（当前版本）" value={variant.role} onChange={(role) => onVariant({ ...variant, role })} /><div className="col-span-2"><DateRangeField startDate={facts.startDate} endDate={facts.endDate} onChange={(startDate, endDate) => onFacts({ ...facts, startDate, endDate })} dateDisplayFormat={dateDisplayFormat} onDateDisplayFormatChange={onDateDisplayFormatChange} /></div><div className="col-span-2"><TextField label="链接" value={facts.link} onChange={(link) => onFacts({ ...facts, link })} /></div></div><div className="mt-3"><TagInput label="技术栈（当前版本）" tags={variant.techStack} onChange={(techStack) => onVariant({ ...variant, techStack })} /></div><div className="mt-3"><BulletList label="项目描述" bullets={variant.bullets} onChange={(bullets) => onVariant({ ...variant, bullets })} bulletAIOpen={"entryId" in (bulletAIOpen ?? {}) ? { entryIndex: 0, bulletIndex: bulletAIOpen?.bulletIndex ?? -1 } : null} entryIndex={0} sectionId="project" onToggleBulletAI={(_, bulletIndex) => onToggleBulletAI(bulletIndex)} /></div></>;
}
