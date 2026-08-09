# Resume density presets

## Goal

Add three density presets (紧凑 / 标准 / 宽松) so users can tighten preview/print spacing and reduce page count without changing structured content or AI/version logic.

## Behavior

- Presets: `compact` | `standard` | `relaxed` (default `standard` ≈ current look)
- Affects preview + `window.print` only
- Persisted on `versionStore.density` with the resume
- Import/new resumes default to `standard`

## Out of scope

Font picker, independent margin sliders, multi-templates, original-file fidelity.

## Implementation

- Tokens in `lib/resume/density.ts` as CSS variables on `.resume-print-root`
- Store get/set/sanitize in `lib/resume/versions.ts`
- UI: segmented control in editor top bar
- Future style knobs can extend the same store field family
