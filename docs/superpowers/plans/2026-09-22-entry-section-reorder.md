# Entry + Section Reorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Work/project entries drag-reorder; all sections (including basic_info) move via up/down buttons.

**Architecture:** Pure `reorderList` helper; entry HTML5 DnD on `EntryCard` (grip-gated); section cards swap grip for move buttons; lift `basic_info` pin in `sanitizeSectionOrder` / preview.

**Tech Stack:** React, existing HTML5 DnD, TypeScript, no new deps.

## Global Constraints

- Only work + project entries get drag reorder (not education/skills/bullets)
- No new DnD libraries
- Minimal diff; reuse existing `onChange` / `updateStore` save path
- Copy/UI in Chinese where user-facing

---

### Task 1: `reorderList` + unpin `basic_info` in section order

**Files:**
- Create: `lib/resume/reorder.ts`
- Modify: `lib/resume/versions.ts` (`sanitizeSectionOrder`, `reorderSections`, comments on `REORDERABLE_SECTION_IDS` / store field)

**Interfaces:**
- Produces: `reorderList<T>(list: readonly T[], fromIndex: number, toIndex: number): T[]`
- Produces: `sanitizeSectionOrder` returns full permutation of `SECTION_IDS` (no forced first `basic_info`)
- Produces: `reorderSections` allows moving `basic_info`

- [ ] **Step 1: Add `lib/resume/reorder.ts`**

```ts
/** Immutable splice-based reorder. Returns same reference if no-op / OOB. */
export function reorderList<T>(
  list: readonly T[],
  fromIndex: number,
  toIndex: number
): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length
  ) {
    return list as T[];
  }
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
```

- [ ] **Step 2: Update `sanitizeSectionOrder` to keep any valid full order**

Replace pin-to-front logic with: walk `order`, keep first occurrence of each `SECTION_IDS` id; append any missing ids in default `SECTION_IDS` order. Do **not** force `basic_info` first.

- [ ] **Step 3: Simplify `reorderSections`**

Remove the early return that blocks `basic_info`. Use `reorderList(order, fromIndex, toIndex)` then `sanitizeSectionOrder`.

- [ ] **Step 4: Manual sanity check in Node**

Run:

```bash
node -e "const {reorderList}=require('./lib/resume/reorder.ts')"
```

Prefer importing via a one-off `npx tsx` if available; otherwise skip and verify via editor after Task 3. Expected: `[a,b,c]` from 0→2 becomes `[b,c,a]`.

- [ ] **Step 5: Commit**

```bash
git add lib/resume/reorder.ts lib/resume/versions.ts
git commit -m "feat: allow full section order including basic_info"
```

---

### Task 2: Section cards — up/down buttons instead of drag

**Files:**
- Modify: `components/resume/editor/SectionEditorCard.tsx`
- Modify: `components/resume/editor/ResumeEditor.tsx` (reorder handlers + props)
- Modify: `components/resume/editor/ResumePreview.tsx` (respect full order including basic_info)

**Interfaces:**
- Consumes: `reorderSections`, `getSectionOrder`
- Produces: `SectionEditorCard` props `onMoveUp?: () => void`, `onMoveDown?: () => void`, `canMoveUp?: boolean`, `canMoveDown?: boolean` (remove drag-related props)

- [ ] **Step 1: Rewrite `SectionEditorCard` header controls**

Remove `draggable` / grip / drag props. Add two icon buttons (e.g. `ChevronUp` / `ChevronDown` from lucide) with `aria-label`「上移」「下移」, calling `onMoveUp` / `onMoveDown`, `disabled` when `!canMoveUp` / `!canMoveDown`. Show buttons for every section.

- [ ] **Step 2: Replace drag state in `ResumeEditor`**

Remove `draggingId` / `dragOverId` and drag handlers. Add:

```ts
const handleMoveSection = (sectionId: SectionId, direction: -1 | 1) => {
  updateStore((s) => {
    const order = getSectionOrder(s);
    const fromIndex = order.indexOf(sectionId);
    if (fromIndex < 0) return s;
    return reorderSections(s, fromIndex, fromIndex + direction);
  });
};
```

Pass `canMoveUp={index > 0}`, `canMoveDown={index < order.length - 1}`, and remove `reorderable = sectionId !== "basic_info"`.

- [ ] **Step 3: Update `ResumePreview`**

Iterate sanitized full `sectionOrder`. For `basic_info`, render existing header block at that position; for other ids, render `BodySection`. Do not always pin header above body.

- [ ] **Step 4: Manual test**

Open editor: move 基本信息 down, confirm preview header moves; top section’s 上移 disabled; bottom’s 下移 disabled.

- [ ] **Step 5: Commit**

```bash
git add components/resume/editor/SectionEditorCard.tsx components/resume/editor/ResumeEditor.tsx components/resume/editor/ResumePreview.tsx
git commit -m "feat: replace section drag with up/down buttons"
```

---

### Task 3: Entry drag reorder for work + project

**Files:**
- Modify: `components/resume/editor/forms/fields.tsx` (`EntryCard`)
- Modify: `components/resume/editor/forms/SectionForms.tsx` (`WorkExperienceForm`, `ProjectForm` only)

**Interfaces:**
- Consumes: `reorderList`
- Produces: `EntryCard` optional reorder props matching prior section pattern (`reorderable`, drag handlers, `isDragging`, `isDragOver`)

- [ ] **Step 1: Extend `EntryCard`**

Add optional grip (only if `reorderable`), grip-gated `draggable`, visual states. Keep delete button. Layout: `[grip?] label …… delete`.

- [ ] **Step 2: Wire `WorkExperienceForm`**

Local `draggingIndex` / `dragOverIndex`. On drop: `onChange({ entries: reorderList(value.entries, from, to) })`. Pass `reorderable` to each `EntryCard`.

- [ ] **Step 3: Wire `ProjectForm` the same way**

Do **not** change education / skills entry cards.

- [ ] **Step 4: Manual test**

Drag 工作经历 1 onto 2; preview swaps; save/refresh persists. Confirm 教育经历 has no grip. Confirm section up/down still works while editing entries.

- [ ] **Step 5: Commit**

```bash
git add components/resume/editor/forms/fields.tsx components/resume/editor/forms/SectionForms.tsx
git commit -m "feat: drag-reorder work and project entries"
```
