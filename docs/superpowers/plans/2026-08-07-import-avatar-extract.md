# Import avatar extraction Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Auto-fill `basic_info.avatar` from embedded images when importing PDF/DOCX.

**Architecture:** Extract candidate images during parse; heuristic pick best portrait-like image; write data URL onto content after AI parse. Failures are silent.

**Tech Stack:** mammoth (DOCX), unpdf `extractImages` (PDF), Node zlib for PNG encode if needed.

## Global Constraints

- Avatar only (not all images).
- Silent fail; never block import.
- Align ~2MB cap with editor AvatarField.
- Minimal new deps.

## File map

| File | Role |
|------|------|
| `lib/resume/avatar-from-file.ts` | Extract candidates, pick best, data URL |
| `lib/resume/extract.ts` | Optional shared buffer helpers if needed |
| `app/api/resume/parse/route.ts` | Wire avatar onto content after parse |

---

### Task 1: Avatar extract + pick module

- [ ] DOCX via mammoth `convertImage`
- [ ] PDF via `extractImages` on first page(s), encode PNG data URL
- [ ] Heuristic + size cap

### Task 2: Wire parse route

- [ ] After `parseResumeText`, if avatar empty, set from picker
- [ ] Catch errors, continue without avatar

### Task 3: Verify typecheck

- [ ] `tsc --noEmit`
