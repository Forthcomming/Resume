# Entry Summary Line Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为工作/项目条目增加可选总结句 `summary`（预览/PDF 无点加粗），解析可输出并启发式迁移旧数据，编辑器可改，并支持与 bullet 同款的单行 AI 优化。

**Architecture:** 在 `WorkEntry`/`ProjectEntry` 增加 `summary` 并归入 entry **variant**；`normalizeResumeContent` 负责缺省与旧 bullet 提升；预览在 `Bullets` 前渲染加粗行；`EditTarget` 新增 `scope: "summary"`，复用现有 adaptive AI 弹层与 Diff，应用时只写回该条 `summary`。

**Tech Stack:** Next.js 14、React、TypeScript、DeepSeek JSON、Vitest

## Global Constraints

- 只改 work/project；不改 education/skills 版式模板。
- `bullets` 永不包含总结句；`summary` 可空字符串。
- 旧数据提升：宁可漏提、不误提。
- 总结句 AI 只改 `summary`，不改同条 `bullets`。
- 不修改 `redcowork-demo/`。
- 最小改动；每任务结束可独立跑相关测试。

## File Map

| 文件 | 职责 |
|------|------|
| `lib/resume/content.ts` | 类型、`empty*`、`normalize*`、`maybePromoteEntrySummary` |
| `lib/resume/content.test.ts`（新建或扩展） | 归一化 / 提升单测 |
| `lib/resume/versions.ts` | variant 含 `summary`；`split*Entry` |
| `lib/resume/versions.test.ts` | round-trip 含 summary |
| `lib/ai/deepseek.ts` | 解析 schema 含 summary |
| `components/resume/editor/ResumePreview.tsx` | 预览/PDF 加粗无点 |
| `components/resume/editor/forms/fields.tsx` | `SummaryField`（输入 + AI 按钮） |
| `components/resume/editor/ModularExperienceSection.tsx` | 接线 summary 编辑与 AI |
| `types/ai-edit.ts` | `scope: "summary"` |
| `lib/ai/describe-target.ts` / `display-value.ts` / `edit-section.ts` / `client-edit.ts` | summary 目标描述、展示、提示、切片 |
| `components/resume/editor/hooks/useResumeAIEdit.ts` | toggle/submit/accept summary |
| `components/resume/editor/sections.ts` | 可选 summary 快捷提示（若弹层按 target 区分；否则复用现有） |
| `lib/ai/edit-section.test.ts` 等 | scope hint / display 覆盖 |

---

### Task 1: 数据模型 + 归一化提升

**Files:**
- Modify: `lib/resume/content.ts`
- Create: `lib/resume/content.test.ts`（若尚无）

**Interfaces:**
- Produces:
  - `WorkEntry.summary?: string` / `ProjectEntry.summary?: string`
  - `emptyWorkEntry()` / `emptyProjectEntry()` 含 `summary: ""`
  - `looksLikeEntrySummary(text: string): boolean`
  - `maybePromoteEntrySummary(entry: { summary?: string; bullets: string[] }): { summary: string; bullets: string[] }`
  - `normalizeWorkEntry` / `normalizeProjectEntry` 在 `normalizeResumeContent` 中对 entries 映射

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from "vitest";
import {
  looksLikeEntrySummary,
  maybePromoteEntrySummary,
  normalizeResumeContent,
} from "./content";

describe("entry summary normalize", () => {
  it("promotes a short first bullet when summary missing and more bullets remain", () => {
    expect(
      maybePromoteEntrySummary({
        bullets: ["负责核心交易链路体验", "推动改版上线", "搭建埋点"],
      })
    ).toEqual({
      summary: "负责核心交易链路体验",
      bullets: ["推动改版上线", "搭建埋点"],
    });
  });

  it("does not promote when only one bullet", () => {
    expect(maybePromoteEntrySummary({ bullets: ["负责需求分析"] })).toEqual({
      summary: "",
      bullets: ["负责需求分析"],
    });
  });

  it("does not promote laundry-list first bullets", () => {
    expect(looksLikeEntrySummary("负责需求、设计、开发、测试与上线等")).toBe(false);
  });

  it("keeps existing summary and does not strip bullets", () => {
    expect(
      maybePromoteEntrySummary({
        summary: "已有总结",
        bullets: ["A", "B"],
      })
    ).toEqual({ summary: "已有总结", bullets: ["A", "B"] });
  });

  it("normalizeResumeContent fills missing summary", () => {
    const content = normalizeResumeContent({
      work: {
        entries: [
          {
            company: "X",
            title: "Y",
            location: "",
            startDate: "",
            endDate: "",
            bullets: ["短总结句示例文本", "具体职责一"],
          },
        ],
      },
    });
    expect(content.work.entries[0].summary).toBeTruthy();
    expect(content.work.entries[0].bullets[0]).toBe("具体职责一");
  });
});
```

启发式约定（写进实现，勿放宽）：

```ts
export function looksLikeEntrySummary(text: string): boolean {
  const t = text.trim();
  if (t.length < 8 || t.length > 48) return false;
  if ((t.match(/[；;、]/g) ?? []).length >= 2) return false;
  if (/等$|等等$/.test(t)) return false;
  return true;
}
```

- [ ] **Step 2: 跑测确认失败**

Run: `npm test -- lib/resume/content.test.ts`  
Expected: FAIL（缺导出/缺字段）

- [ ] **Step 3: 最小实现**

在 `content.ts`：

1. `WorkEntry` / `ProjectEntry` 增加 `summary?: string`
2. `emptyWorkEntry` / `emptyProjectEntry` 设 `summary: ""`
3. 实现 `looksLikeEntrySummary`、`maybePromoteEntrySummary`
4. `normalizeWorkEntry` / `normalizeProjectEntry`：合并缺省后调用 `maybePromoteEntrySummary`，保证 `summary` 为 string、`bullets` 至少 `[""]`（与现空条目习惯一致）
5. `normalizeResumeContent` 对 `work.entries` / `project.entries` 做 map

- [ ] **Step 4: 跑测通过**

Run: `npm test -- lib/resume/content.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/resume/content.ts lib/resume/content.test.ts
git commit -m "feat: add entry summary field and import promotion"
```

---

### Task 2: 版本 variant 贯通 summary

**Files:**
- Modify: `lib/resume/versions.ts`（`WorkEntryVariant` / `ProjectEntryVariant`、`splitWorkEntry` / `splitProjectEntry`、以及任何手写 `{ title, bullets }` / `{ role, techStack, bullets }` 构造处）
- Modify: `lib/resume/versions.test.ts`（及 `lib/resume/tailoring.test.ts`、`lib/ai/jd-plan.test.ts`、`lib/ai/edit-section.test.ts` 等因类型补 `summary` 的编译修复，能编译即可，勿扩功能）

**Interfaces:**
- Consumes: `WorkEntry.summary` / `ProjectEntry.summary`
- Produces:
  - `WorkEntryVariant = Pick<WorkEntry, "title" | "summary" | "bullets">`
  - `ProjectEntryVariant = Pick<ProjectEntry, "role" | "techStack" | "summary" | "bullets">`
  - `splitWorkEntry` / `splitProjectEntry` 写入 `summary: entry.summary ?? ""`
  - `composeFromSectionSubVersions` 经 spread 自动带上 summary（无需新逻辑，但需测）

- [ ] **Step 1: 写失败测试**

在 `versions.test.ts` 增加：

```ts
it("round-trips work entry summary through compose", () => {
  const content = emptyResumeContent();
  content.work.entries = [
    {
      company: "示例",
      title: "产品",
      location: "",
      startDate: "2025-01",
      endDate: "2025-06",
      summary: "负责增长方向体验",
      bullets: ["完成改版"],
    },
  ];
  const store = createSectionSubVersionsStoreFromContent(/* 用仓库现有工厂 */ content);
  const composed = composeFromSectionSubVersions(store);
  expect(composed.work.entries[0].summary).toBe("负责增长方向体验");
  expect(composed.work.entries[0].bullets).toEqual(["完成改版"]);
});
```

（工厂函数名以 `versions.ts` 现有导出为准，如 `createSectionSubVersionsStore` / `buildStoreFromContent`——实现时对照现有测试写法。）

- [ ] **Step 2: 跑测确认失败或类型报错**

Run: `npm test -- lib/resume/versions.test.ts`

- [ ] **Step 3: 更新 variant 类型与 split**

```ts
export type WorkEntryVariant = Pick<WorkEntry, "title" | "summary" | "bullets">;
// splitWorkEntry:
variant: {
  title: entry.title,
  summary: entry.summary ?? "",
  bullets: [...entry.bullets],
},
```

项目同理。全文件搜索只构造 `title`+`bullets` 或 `role`+`techStack`+`bullets` 的地方，补上 `summary: ""` 或保留字段。

- [ ] **Step 4: 跑相关测试**

Run: `npm test -- lib/resume/versions.test.ts lib/resume/tailoring.test.ts lib/ai/jd-plan.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/resume/versions.ts lib/resume/versions.test.ts lib/resume/tailoring.test.ts lib/ai/jd-plan.test.ts
git commit -m "feat: carry entry summary in version variants"
```

---

### Task 3: 解析提示词输出 summary

**Files:**
- Modify: `lib/ai/deepseek.ts`（`SYSTEM_PROMPT` JSON schema）
- Modify: `lib/ai/edit-section.ts`（`SECTION_SCHEMA_HINTS` 的 work/project 字符串加入 `"summary": ""`）

**Interfaces:**
- Produces: 解析与 section 级改写 schema 均声明 `summary`

- [ ] **Step 1: 更新解析 SYSTEM_PROMPT**

将 work/project entry 示意改为含 `"summary": "可选一句总述，可空"`，并加规则：

```
- work/project 每条可有 summary：一句概括该段经历；bullets 不要重复放入该句；无总述则 summary 为 ""。
```

- [ ] **Step 2: 同步 SECTION_SCHEMA_HINTS**

```ts
work: '{ "entries": [{ "company": "", "title": "", "location": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM|present", "summary": "", "bullets": ["..."] }] }',
project: '{ "entries": [{ "name": "", "role": "", "startDate": "", "endDate": "", "techStack": [""], "link": "", "summary": "", "bullets": ["..."] }] }',
```

- [ ] **Step 3: Commit**

```bash
git add lib/ai/deepseek.ts lib/ai/edit-section.ts
git commit -m "feat: include summary in parse and edit schemas"
```

---

### Task 4: 预览 / PDF 展示加粗无点总结句

**Files:**
- Modify: `components/resume/editor/ResumePreview.tsx`

**Interfaces:**
- Consumes: `e.summary`
- Produces: 元信息行下、`Bullets` 上的加粗段落

- [ ] **Step 1: 增加 EntrySummary 渲染**

```tsx
function EntrySummary({ text }: { text?: string }) {
  const value = text?.trim();
  if (!value) return null;
  return (
    <p className="mt-0.5 text-[length:var(--resume-body-size)] font-bold leading-[var(--resume-leading)] text-[#222]">
      {value}
    </p>
  );
}
```

在 `WorkBlock` / `ProjectBlock` 中，`<Bullets items={e.bullets} />` 前插入 `<EntrySummary text={e.summary} />`。  
分页：总结句不要单独加 `data-resume-break`（避免与条目首部拆开）；条目外层已有 `data-resume-break` 即可。

- [ ] **Step 2: 手工快速确认（开发态）**

本地打开含 summary 的条目：屏幕预览首行无圆点、加粗；导出 PDF 一致。

- [ ] **Step 3: Commit**

```bash
git add components/resume/editor/ResumePreview.tsx
git commit -m "feat: render bold entry summary without bullet"
```

---

### Task 5: 编辑器总结句输入

**Files:**
- Modify: `components/resume/editor/forms/fields.tsx`（新增 `SummaryField`，本任务先不接 AI，或预留可选 `onToggleAI`）
- Modify: `components/resume/editor/ModularExperienceSection.tsx`（`WorkFields` / `ProjectFields`）
- 若 flat `SectionForms.tsx` 仍用于非模块路径：同样在 bullets 前加总结句输入（与 Modular 行为一致）

**Interfaces:**
- Produces: `SummaryField({ label?, value, onChange, onToggleAI?, aiOpen? })`

- [ ] **Step 1: 实现 SummaryField**

复用 `inputClass` 与 bullet 旁按钮布局；本任务 `onToggleAI` 可先可选不传。

```tsx
export function SummaryField({
  label = "总结句",
  value,
  onChange,
  aiOpen,
  onToggleAI,
}: {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  aiOpen?: boolean;
  onToggleAI?: () => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-[12px] font-medium text-ink-soft">{label}</span>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="一句概括（可选，预览加粗无点）"
          className={inputClass}
        />
        {onToggleAI && (
          <button
            type="button"
            onClick={onToggleAI}
            aria-label="AI 优化总结句"
            className={/* 与 BulletList AI 按钮同款 clsx */}
          >
            <Sparkles size={14} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 接到 WorkFields / ProjectFields**

在 `BulletList` 上方：

```tsx
<div className="mt-3">
  <SummaryField
    value={variant.summary ?? ""}
    onChange={(summary) => onVariant({ ...variant, summary })}
  />
</div>
<div className="mt-3">
  <BulletList ... />
</div>
```

- [ ] **Step 3: 确认预览联动**

编辑 summary → `composeFromSectionSubVersions` → 预览加粗行更新。

- [ ] **Step 4: Commit**

```bash
git add components/resume/editor/forms/fields.tsx components/resume/editor/ModularExperienceSection.tsx components/resume/editor/forms/SectionForms.tsx
git commit -m "feat: add summary field to work/project editors"
```

---

### Task 6: 总结句 AI 优化（EditTarget + 应用）

**Files:**
- Modify: `types/ai-edit.ts`
- Modify: `lib/ai/describe-target.ts`
- Modify: `lib/ai/display-value.ts`
- Modify: `lib/ai/edit-section.ts`（`buildScopeHint`）
- Modify: `lib/ai/client-edit.ts`（`getEditSlice` / `applyAIEdit` 识别 summary，与 bullet 一样走 section 切片）
- Modify: `components/resume/editor/hooks/useResumeAIEdit.ts`
- Modify: `components/resume/editor/ModularExperienceSection.tsx`（接线 `onToggleSummaryAI`）
- Modify: `lib/ai/display-value.ts` 旁测试或新建 `lib/ai/display-value.test.ts`；扩展 `describe-target` 若有测

**Interfaces:**
- Produces:

```ts
| {
    scope: "summary";
    sectionId: "work" | "project";
    entryId: string;
    entryVersionId: string;
  }
```

- `describeAIEditTarget`: subtitle `"总结句"`
- `aiPromptPlaceholder`: `"例如：更概括、突出成果、补一句总述"`
- `extractAIEditDisplayValue`: 返回该条 `summary` 字符串
- `buildScopeHint`: `仅优化该经历的 summary（一句总述），保持 bullets 及其他字段不变。若 summary 为空，可基于同条 bullets 与职位/角色生成一句，不得虚构事实。`
- `useResumeAIEdit.acceptAIEdit`: summary 与 bullet 类似，从 `suggested.entries[0]` 取 `summary`，写回 variant 时**保留** title/role/techStack/bullets，只更新 `summary`；bullet 接受路径须 **保留** 现有 `summary`（从 suggested 读取，缺省用当前 variant）

- [ ] **Step 1: 写 display / describe 失败测试**

```ts
it("extracts summary string for summary scope", () => {
  expect(
    extractAIEditDisplayValue(
      { scope: "summary", sectionId: "work", entryId: "e1", entryVersionId: "v1" },
      { entries: [{ summary: "一句总述", bullets: ["a"] }] }
    )
  ).toBe("一句总述");
});
```

- [ ] **Step 2: 扩展类型与纯函数**

按上表改 `EditTarget`、`describe-target`、`display-value`、`buildScopeHint`；`getEditSlice`/`applyAIEdit` 的 scope 联合判断加入 `"summary"`（与 bullet 相同返回/替换 section）。

- [ ] **Step 3: useResumeAIEdit**

1. 将 `bulletAIOpen` 状态泛化为可持有 `BulletAITarget | SummaryAITarget`，或新增 `summaryAIOpen`（二选一；推荐**单一** `lineAIOpen`/`entryAIOpen` 联合，避免两套互斥逻辑分叉——若改动过大，则新增 `summaryAIOpen` 并在 toggle 时互斥清空）。
2. `toggleSummaryAI(target)`：打开时关 section AI；与 bullet 互斥。
3. `submitAIEdit`：若 summary 打开则 `runAIEdit(summaryTarget, instruction)`。
4. `acceptAIEdit`：
   - `scope === "summary"`：`updateActiveEntryVersionContent` 合并 `{ ...currentVariant, summary: String(row.summary ?? "") }`
   - `scope === "bullet"`：写回 bullets 时带上 `summary: String(row.summary ?? currentSummary)`

- [ ] **Step 4: UI 接线**

`WorkFields` / `ProjectFields` 给 `SummaryField` 传 `onToggleAI` / `aiOpen`，target：

```ts
{ scope: "summary", sectionId: "work", entryId, entryVersionId: active.id }
```

确保 AI 弹层 `target` 取自 summary open 状态（与 bullet 相同渲染 `AIInlinePrompt` / `AIModal` 的路径）。

- [ ] **Step 5: 跑测**

Run: `npm test -- lib/ai/display-value.test.ts lib/ai/edit-section.test.ts lib/resume/content.test.ts lib/resume/versions.test.ts`  
Expected: PASS

手工：空 summary 点 AI → Diff 出一句 → 应用后仅 summary 变；bullet AI 应用后 summary 不丢。

- [ ] **Step 6: Commit**

```bash
git add types/ai-edit.ts lib/ai/describe-target.ts lib/ai/display-value.ts lib/ai/display-value.test.ts lib/ai/edit-section.ts lib/ai/client-edit.ts components/resume/editor/hooks/useResumeAIEdit.ts components/resume/editor/ModularExperienceSection.tsx components/resume/editor/forms/fields.tsx
git commit -m "feat: add per-entry summary AI optimize"
```

---

## Spec Coverage Checklist

| Spec 要求 | Task |
|-----------|------|
| `summary` 字段 / 空缺省 | 1 |
| variant 含 summary | 2 |
| 解析输出 summary | 3 |
| 旧数据启发式提升 | 1 |
| 预览/PDF 无点加粗 | 4 |
| 编辑器输入 | 5 |
| 总结句旁 AI（scope summary） | 6 |
| AI/JD 路径不丢字段 | 2 + 3 schema + 6 accept |
| 不做教育板块 / 批处理生成 | 全局约束 |

## Self-Review Notes

- 无 TBD；启发式阈值写死在 Task 1。
- `compose` 靠 variant spread，不另写合并函数。
- bullet accept 必须保留 summary，避免回归。
