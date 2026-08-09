# Resume density presets Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add compact/standard/relaxed density presets to resume preview + print, persisted on versionStore.

**Architecture:** Density tokens as CSS variables on `.resume-print-root`; store field + segmented UI in editor.

**Tech Stack:** Next.js, existing `SectionSubVersionsStore`, `ResumePreview`, print CSS.

## File map

| File | Role |
|------|------|
| `lib/resume/density.ts` | Type, default, labels, CSS var tokens |
| `lib/resume/versions.ts` | Field + get/set/sanitize |
| `app/globals.css` | Optional base var hooks if needed |
| `components/resume/editor/ResumePreview.tsx` | Apply density vars / classes |
| `components/resume/editor/DensityToggle.tsx` | Segmented control |
| `components/resume/editor/ResumeEditor.tsx` | Wire state + UI |
| `components/resume/editor/EditorTopBar.tsx` | Optional slot for toggle |

---

### Task 1: Density module + store

- [ ] Create `lib/resume/density.ts`
- [ ] Add `density` to store; get/set/sanitize like date format

### Task 2: Preview tokens

- [ ] Pass `density` into `ResumePreview`
- [ ] Map tokens to CSS variables; replace density-related hard sizes

### Task 3: UI + wire

- [ ] `DensityToggle` 紧凑/标准/宽松
- [ ] Editor: read/write density, autosave via existing `updateStore`

### Task 4: Verify

- [ ] Default standard looks ~current
- [ ] Compact tighter; persists after reload
