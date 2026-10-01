# Editor JD Tailoring Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the editor’s JD issue checker with an entry into a standalone, evidence-backed JD tailoring flow that creates a new resume without modifying the source resume.

**Architecture:** Keep the editor entry stateless, load the complete source workspace on `/resume/[id]/tailor`, and use one structured DeepSeek plan endpoint followed by deterministic validation and pure action application. Cloud creation re-reads and validates the source workspace server-side; local mode applies the same pure functions in the browser and writes the existing local-storage keys.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Supabase SSR/RLS, DeepSeek JSON client, Vitest.

## Global Constraints

- Only add the editor entry; do not add a Dashboard entry.
- The editor entry contains no JD fields or analysis state and navigates to `/resume/[id]/tailor`.
- The source resume is the implicit base and must never be modified by tailoring.
- Do not persist the JD, evidence map, plan, or analysis history.
- Do not add a database table or schema migration.
- Do not expose a percentage match score.
- Analyze every section sub-version, not only the active composition.
- Support only `keep`, `switch_version`, and `rewrite_bullet` actions.
- Never generate a rewrite for a `missing` requirement or invent facts or numbers.
- Create a new resume only after explicit user confirmation; cloud creation must be all-or-nothing.
- Keep `/api/resume/jd-check` in the repository but remove it from the active UI.
- Preserve BYOK behavior and the shared `requestDeepseekJson` transport.
- Preserve current local-storage keys and cloud/local fallback behavior.
- Do not touch unrelated `package.json`, `.agents/`, `output/`, `redcowork-demo/`, `skills-lock.json`, or `tmp/` changes.

---

### Task 1: Define and test the tailoring domain model

**Files:**
- Create: `types/jd-tailoring.ts`
- Create: `lib/resume/tailoring.ts`
- Create: `lib/resume/tailoring.test.ts`

**Interfaces:**
- Produces: `JdRequirement`, `ResumeEvidence`, `JdRecommendationAction`, `JdAdaptationPlan`, and `SelectedTailoringActions`.
- Produces: `createWorkspaceFingerprint(title, content, store): string`.
- Produces: `applyTailoringActions(store, actions, versionName): SectionSubVersionsStore`.
- Produces: `defaultTailoredResumeTitle(companyName, jobTitle): string`.

- [ ] **Step 1: Create the shared types**

Create `types/jd-tailoring.ts` with the exact discriminated unions from the design:

```ts
import type { SectionId } from "@/types/ai-edit";

export type JdCoverage = "covered" | "weak" | "missing";
export type JdImportance = "core" | "bonus";

export interface JdRequirement {
  id: string;
  title: string;
  jdQuote: string;
  importance: JdImportance;
  coverage: JdCoverage;
}

export interface ResumeEvidence {
  id: string;
  requirementId: string;
  sectionId: SectionId;
  versionId: string;
  versionName: string;
  entryIndex?: number;
  bulletIndex?: number;
  text: string;
  reason: string;
  isActive: boolean;
}

export type JdRecommendationAction =
  | { id: string; type: "keep"; sectionId: SectionId; versionId: string; reason: string }
  | { id: string; type: "switch_version"; sectionId: SectionId; fromVersionId: string; toVersionId: string; reason: string; requirementIds: string[] }
  | { id: string; type: "rewrite_bullet"; sectionId: "work" | "project" | "education"; versionId: string; entryIndex: number; bulletIndex: number; original: string; suggested: string; reason: string; requirementIds: string[] };

export interface JdAdaptationPlan {
  sourceFingerprint: string;
  jobTitle: string;
  companyName: string;
  requirements: JdRequirement[];
  evidence: ResumeEvidence[];
  targetVersionBySection: Partial<Record<SectionId, string>>;
  actions: JdRecommendationAction[];
}

export interface SelectedTailoringActions {
  switchActionIds: string[];
  rewriteActionIds: string[];
}
```

- [ ] **Step 2: Write failing pure-function tests**

Create tests covering stable fingerprints, source mutation, action validation, version switching, grouped rewrites, and title fallback. Use `initSectionSubVersionsStore`, add a named data version, and assert:

```ts
expect(createWorkspaceFingerprint("主简历", content, store))
  .toBe(createWorkspaceFingerprint("主简历", content, store));
expect(createWorkspaceFingerprint("主简历", changedContent, store))
  .not.toBe(createWorkspaceFingerprint("主简历", content, store));

const result = applyTailoringActions(store, [switchAction, rewriteAction], "AI 产品版");
expect(result).not.toBe(store);
expect(store.sections.work.versions).toHaveLength(2);
expect(result.sections.work.versions).toHaveLength(3);
expect(getActiveSectionContent(result, "work").entries[0].bullets[0]).toBe("建议文本");
expect(() => applyTailoringActions(store, [staleRewrite], "AI 产品版"))
  .toThrow("原始 Bullet 已变化");
expect(defaultTailoredResumeTitle("字节跳动", "AI 产品经理")).toBe("字节跳动·AI 产品经理");
expect(defaultTailoredResumeTitle("", "AI 产品经理")).toBe("AI 产品经理·定制版");
```

Run: `npm test -- lib/resume/tailoring.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement deterministic fingerprint and application**

Implement a stable JSON serializer that sorts object keys and a synchronous FNV-1a hash. In `applyTailoringActions`:

1. Sanitize and clone the store.
2. Validate every referenced version and Bullet before any mutation.
3. Apply unique switch actions.
4. Group accepted rewrites by section and source version.
5. Duplicate the target source version once per section with `createdBy: "ai"`.
6. Apply every accepted rewrite to that duplicate.
7. Set the duplicate active and return the new store.

Throw exact user-safe errors: `推荐版本不存在`, `Bullet 索引无效`, `原始 Bullet 已变化`, and `同一板块存在冲突版本`.

- [ ] **Step 4: Run and commit**

Run:

```powershell
npm test -- lib/resume/tailoring.test.ts
npx tsc --noEmit
```

Expected: PASS.

Commit:

```powershell
git add types/jd-tailoring.ts lib/resume/tailoring.ts lib/resume/tailoring.test.ts
git commit -m "feat: add JD tailoring domain model"
```

---

### Task 2: Generate and sanitize evidence-backed JD plans

**Files:**
- Create: `lib/ai/jd-plan.ts`
- Create: `lib/ai/jd-plan.test.ts`
- Create: `app/api/resume/jd-plan/route.ts`
- Create: `lib/ai/client-jd-plan.ts`

**Interfaces:**
- Consumes: `requestDeepseekJson<T>()`, `SectionSubVersionsStore`, and `JdAdaptationPlan`.
- Produces: `generateJdAdaptationPlan(params): Promise<JdAdaptationPlan>`.
- Produces: `sanitizeJdAdaptationPlan(raw, context): JdAdaptationPlan`.
- Produces: `requestJdAdaptationPlan(params): Promise<JdAdaptationPlan>`.

- [ ] **Step 1: Write sanitizer tests before AI code**

Use a fixture with one current product version and one data version. Test that sanitization:

- keeps 3–5 valid requirements;
- copies the caller-computed fingerprint rather than trusting AI;
- rejects invalid section/version/Bullet references;
- removes rewrite actions attached only to `missing` requirements;
- removes conflicting switches for one section;
- recomputes `isActive` and `versionName` from the real store;
- truncates evidence and actions to safe limits.

Run: `npm test -- lib/ai/jd-plan.test.ts`

Expected: FAIL because `jd-plan.ts` does not exist.

- [ ] **Step 2: Implement compact version input and sanitizer**

Build AI input as stable records containing exact IDs and text:

```ts
{
  sectionId,
  activeVersionId,
  versions: [{
    versionId,
    versionName,
    content,
  }],
}
```

Validate with sets derived from the real store; never accept AI-provided IDs that are absent. Assign stable output IDs by result order (`req-1`, `evidence-1`, `action-1`).

- [ ] **Step 3: Implement the DeepSeek prompt**

The system prompt must explicitly require:

- 3–5 requirements with verbatim JD quotes;
- evidence only from supplied IDs/text;
- one globally consistent target version per section;
- reuse of existing versions before rewrites;
- rewrite only `work`, `project`, and `education` Bullet strings;
- no invented facts or numbers;
- no rewrite for missing evidence;
- strict JSON matching the domain schema.

Call `requestDeepseekJson` with temperature `0.2` and existing BYOK error semantics.

- [ ] **Step 4: Add route and client wrapper**

`POST /api/resume/jd-plan` accepts:

```ts
{
  title: string;
  content: ResumeContent;
  versionStore: SectionSubVersionsStore;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
}
```

Validate job title, JD length >= 80, parsed store, and non-empty resume before calling AI. Read `x-deepseek-api-key`; map `AIError` to its status.

The browser wrapper adds `deepseekAuthHeaders()` and preserves the returned Chinese error.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm test -- lib/ai/jd-plan.test.ts lib/ai/deepseek-client.test.ts
npm run lint
npx tsc --noEmit
```

Expected: PASS; no real DeepSeek request in tests.

Commit:

```powershell
git add lib/ai/jd-plan.ts lib/ai/jd-plan.test.ts app/api/resume/jd-plan/route.ts lib/ai/client-jd-plan.ts
git commit -m "feat: generate evidence-backed JD plans"
```

---

### Task 3: Create cloud and local tailored resume copies

**Files:**
- Modify: `services/resumes.ts`
- Modify: `app/resume/[id]/actions.ts`
- Modify: `lib/resume/local-storage.ts`
- Create: `lib/resume/tailored-copy.ts`
- Create: `lib/resume/tailored-copy.test.ts`

**Interfaces:**
- Consumes: `applyTailoringActions`, `composeFromSectionSubVersions`, `createWorkspaceFingerprint`.
- Produces: `createResumeWorkspace(title, content, store): Promise<string | null>`.
- Produces: `createTailoredResumeAction(input)` with `{ ok, configured, resumeId?, error? }`.
- Produces: `saveLocalResumeWorkspace(id, title, content, store): void`.

- [ ] **Step 1: Write copy-building tests**

Test `buildTailoredWorkspace` with a source title/content/store, plan, selected action IDs, and output title. Assert the source stays deeply equal, output fingerprint differs after accepted rewrite, ignored actions do not apply, and stale source fingerprint throws.

- [ ] **Step 2: Implement the shared copy builder**

```ts
export function buildTailoredWorkspace(input: {
  sourceTitle: string;
  sourceContent: ResumeContent;
  sourceStore: SectionSubVersionsStore;
  expectedFingerprint: string;
  plan: JdAdaptationPlan;
  selected: SelectedTailoringActions;
  outputTitle: string;
}): { title: string; content: ResumeContent; versionStore: SectionSubVersionsStore }
```

Select actions only by IDs present in `plan.actions`, validate fingerprint, apply them, compose content, and reject blank output titles.

- [ ] **Step 3: Add one-write cloud creation**

Add `createResumeWorkspace` to insert title, composed content, sanitized version store, section order, and tags in one Supabase insert under RLS.

`createTailoredResumeAction` must re-read the source workspace and title, rebuild the current fingerprint, call the copy builder, and then insert. It must never update the source row.

- [ ] **Step 4: Add local workspace persistence**

Add:

```ts
export function saveLocalResumeWorkspace(
  id: string,
  title: string,
  content: ResumeContent,
  store: SectionSubVersionsStore
): void
```

It calls the existing content, version-store, and index functions. The client generates `crypto.randomUUID()` only when the server action returns `configured: false`.

- [ ] **Step 5: Verify and commit**

Run `npm test -- lib/resume/tailored-copy.test.ts lib/resume/tailoring.test.ts`, `npm run lint`, and `npx tsc --noEmit`.

Commit only the five listed files with message `feat: create tailored resume copies`.

---

### Task 4: Build the standalone tailoring page

**Files:**
- Create: `app/resume/[id]/tailor/page.tsx`
- Create: `components/resume/tailor/TailorPageClient.tsx`
- Create: `components/resume/tailor/TailorJobForm.tsx`
- Create: `components/resume/tailor/TailorRequirementCard.tsx`
- Create: `components/resume/tailor/TailorActionCard.tsx`
- Create: `components/resume/tailor/TailorPlanSummary.tsx`
- Create: `components/resume/tailor/TailorFooter.tsx`

**Interfaces:**
- Consumes: server workspace/title, `requestJdAdaptationPlan`, `createTailoredResumeAction`, local persistence, and domain types.
- Produces: form → plan → confirm → create flow at `/resume/[id]/tailor`.

- [ ] **Step 1: Add server page with local fallback inputs**

Mirror the editor page: load `getResume` and `getResumeWorkspace`, accept an optional `title` query for local-only resumes, call `notFound()` only when neither server title nor fallback exists, and render `EnsureAnonymousSession` plus `TailorPageClient`.

- [ ] **Step 2: Build form state and local hydration**

`TailorPageClient` receives initial content/store and on mount falls back to `readLocalResumeContent(id)` plus `readSectionSubVersionsStore(id)`. If only flat content exists, initialize a store. Disable generation until hydration completes.

`TailorJobForm` validates title and 80-character JD, preserves fields after API errors, and calls a single `onSubmit` prop.

- [ ] **Step 3: Render explainable plan results**

For each requirement, show importance, coverage label, JD quote, linked evidence, version source, and reason. Render one deduplicated action card per action. Use checkboxes for switch/rewrite, not for keep.

`TailorActionCard` uses the existing Diff visual language for Bullet original/suggested text and offers use suggestion, keep original, and retry. Retry calls the existing Bullet edit API and only replaces that action’s `suggested` string.

- [ ] **Step 4: Add summary and creation flow**

Default-select all valid switch/rewrite actions. `TailorPlanSummary` shows target version names and selected counts. `TailorFooter` provides “返回修改 JD” and “生成岗位定制版”.

On create:

1. Validate non-empty output name.
2. Call server action.
3. If configured and successful, `router.push(/resume/newId)`.
4. If not configured, run the same `buildTailoredWorkspace`, save under a new local ID, and push `/resume/newId?title=...`.
5. Keep plan and selection intact on failure.

- [ ] **Step 5: Verify page behavior**

Run `npm run dev` and manually check blank validation, API error preservation, result cards, action toggles, retry isolation, source-change rejection, successful local/cloud copy, back navigation, and opening the new editor.

- [ ] **Step 6: Commit**

Commit only the new route and `components/resume/tailor/` files with message `feat: add JD tailoring workspace`.

---

### Task 5: Replace the editor JD checker with the tailoring entry

**Files:**
- Create: `components/resume/editor/JDTailorEntry.tsx`
- Modify: `components/resume/editor/ResumeEditor.tsx`
- Keep unused for compatibility: `components/resume/editor/JDPanel.tsx`

**Interfaces:**
- Consumes: `id`, `resumeTitle`, `SaveState`, and `retrySave`.
- Produces: navigation to `/resume/[id]/tailor?title=<encoded title>`.

- [ ] **Step 1: Implement the stateless entry**

Render the approved copy, Target icon, source title subtitle, and button states:

- saved → `开始定制`;
- saving → disabled `保存完成后开始`;
- error → `重试保存` invoking the existing retry callback.

Use a Next.js `Link` only for saved state; do not hold JD or AI state.

- [ ] **Step 2: Wire the entry into ResumeEditor**

Replace:

```tsx
<JDPanel content={versions.composedContent} onOptimize={ai.optimizeSection} />
```

with:

```tsx
<JDTailorEntry
  resumeId={id}
  resumeTitle={persistence.resumeTitle}
  saveState={persistence.saveState}
  onRetrySave={persistence.retrySave}
/>
```

Remove the `JDPanel` import. Keep the AI hook because section/Bullet editing still uses it.

- [ ] **Step 3: Verify and commit**

Run tests, lint, typecheck, then open the editor and confirm there are no JD fields or issue cards at the bottom. Click the entry and verify current ID/title reach the standalone page.

Commit message: `feat: make JD tailoring the editor entry`.

---

### Task 6: Documentation and release verification

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `AGENTS.md` only if the current-state paragraph needs the new flow

**Interfaces:**
- Produces: one current description of the active JD flow and verified release gates.

- [ ] **Step 1: Update architecture**

Replace the active JD-check description with:

- editor entry → standalone tailoring route;
- `/api/resume/jd-plan` evidence-backed plan;
- existing `/api/resume/jd-check` retained but inactive;
- copy-on-confirm behavior and no analysis persistence.

- [ ] **Step 2: Run the complete gate**

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Expected: all pass; production build contains `/resume/[id]/tailor` and `/api/resume/jd-plan`; no Supabase Edge Runtime `process.version` warning.

- [ ] **Step 3: Run end-to-end acceptance**

With the current browser demo, verify all 11 page acceptance scenarios in the design, including source resume unchanged after new copy creation. Keep the final tailored editor page open for the user.

- [ ] **Step 4: Commit documentation**

Commit only documentation changes with message `docs: document JD tailoring flow`.

---

## Completion Gate

- [ ] Editor bottom contains only the tailoring entry.
- [ ] Tailoring page defaults to the current resume and never asks for base selection.
- [ ] Requirements include exact JD quotes and evidence identifies real versions/Bullets.
- [ ] Recommendations form one globally consistent section-version combination.
- [ ] Missing evidence never produces a rewrite action.
- [ ] Users can deselect every switch and rewrite independently.
- [ ] Accepted rewrites create one new AI version per affected section.
- [ ] Cloud and local modes create a new resume without mutating the source.
- [ ] Stale source fingerprints block creation.
- [ ] JD input and plan are not persisted.
- [ ] Tests, lint, typecheck, and production build pass.
