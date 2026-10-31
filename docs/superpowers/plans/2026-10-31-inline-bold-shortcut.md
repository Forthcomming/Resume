# Inline Bold Shortcut Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 编辑器文本控件支持 Ctrl/Cmd+B 切换 `**加粗**`，预览与 PDF 渲染成对标记。

**Architecture:** 纯函数 `toggleInlineBoldMarkdown` + `parseInlineBoldSegments`；共用 field 的 keydown 写回选区；`ResumePreview` 文本出口走 segments 渲染。

**Tech Stack:** TypeScript、React、Vitest

## Global Constraints

- 仅成对 `**…**`；不做其它 Markdown
- 仍存纯字符串；不改 schema
- 不改 `redcowork-demo/`
- 无选区插入 `****`；有选区包裹或取消；操作后选区按 spec

---

### Task 1: 纯函数 + 单测

**Files:**
- Create: `lib/resume/inline-bold.ts`
- Create: `lib/resume/inline-bold.test.ts`

**Interfaces:**
- Produces:
  - `toggleInlineBoldMarkdown(value, start, end): { value, selectionStart, selectionEnd }`
  - `parseInlineBoldSegments(text): Array<{ type: "text" | "bold"; value: string }>`

- [ ] 写测：包裹、取消包裹、无选区、未闭合 `**` 渲染为 text
- [ ] 实现并通过 `npm test -- lib/resume/inline-bold.test.ts`
- [ ] Commit: `feat: add inline bold markdown helpers`

### Task 2: 表单控件接线

**Files:**
- Modify: `components/resume/editor/forms/fields.tsx`

**Interfaces:**
- Consumes: `toggleInlineBoldMarkdown`
- Produces: `handleInlineBoldKeyDown` 用于 input/textarea

- [ ] TextField / TextAreaField / SummaryField / BulletList / TagInput 拦截 Ctrl/Cmd+B
- [ ] Commit: `feat: wire Ctrl/Cmd+B on editor text fields`

### Task 3: 预览渲染

**Files:**
- Modify: `components/resume/editor/ResumePreview.tsx`

- [ ] bullets、summary、个人简介等可见字符串用 `parseInlineBoldSegments` 渲 `<strong>`
- [ ] Commit: `feat: render inline bold in resume preview`

---
