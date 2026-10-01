# ResumeKit Engineering Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the current fixed campus-resume preview WIP, add a minimal regression safety net, centralize DeepSeek JSON transport, split `ResumeEditor` orchestration into focused hooks, and remove the Supabase Edge Runtime build warning without changing the user workflow.

**Architecture:** Preserve the current routes, storage keys, database schema, prompts, and UI behavior. Put reusable transport and state-machine responsibilities behind small typed interfaces, keep business normalization inside feature modules, and protect pure resume logic with Vitest before moving editor code.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Supabase SSR/Auth, DeepSeek Chat Completions, Vitest, html2canvas, jsPDF.

## Global Constraints

- Keep the active preview as fixed A4 multipage campus-resume layout with centered name, optional top-right avatar, phone/email contact row, three-column experience rows, Chinese underlined section titles, and default `YYYY.MM` dates.
- Keep `SectionSubVersionsStore.density` only as a deprecated read-compatible field; it must not affect sanitization, editor state, preview rendering, or PDF export.
- Do not change database schema, API paths, request payloads, local-storage keys, or the existing dashboard/editor/settings information architecture.
- DeepSeek remains BYOK-first with `DEEPSEEK_API_KEY` fallback, `DEEPSEEK_API_URL`/`DEEPSEEK_MODEL` overrides, and a 60,000 ms default timeout.
- Upgrade only `@supabase/supabase-js` to a declared floor of `^2.110.5`; keep `@supabase/ssr` at `^0.5.2`.
- Do not add React Testing Library, a browser test framework, Zustand, or SWR.
- Do not commit `.env.local` or touch `output/`, `.agents/`, `skills-lock.json`, or unrelated user files.
- Do not delete `.tmp-docx-template/`, `.tmp-docx-template.zip`, or `.superpowers/` until the final candidate list is shown to the user and the user explicitly confirms deletion again.
- Every task ends with its own verification and focused commit; do not advance while the current task is failing.

---

### Task 1: Finalize the fixed campus-resume preview contract

**Files:**
- Modify: `components/resume/editor/EditorTopBar.tsx`
- Modify: `components/resume/editor/ResumeEditor.tsx`
- Modify: `components/resume/editor/ResumePreview.tsx`
- Delete already staged WIP: `components/resume/editor/DensityToggle.tsx`
- Modify: `lib/resume/date-display.ts`
- Modify: `lib/resume/density.ts`
- Modify: `lib/resume/versions.ts`
- Modify: `docs/ARCHITECTURE.md`
- Add existing product specs to the closeout commit: `docs/superpowers/specs/2026-09-22-campus-resume-preview-design.md`
- Add existing product specs to the closeout commit: `docs/superpowers/specs/2026-09-22-single-campus-preview-design.md`

**Interfaces:**
- Consumes: `ResumePreviewProps` with `title`, `content`, `sectionOrder`, `sectionTitles`, and `dateDisplayFormat`.
- Produces: a single fixed preview with no density prop or density event; `getDateDisplayFormat(store): DateDisplayFormat` defaults to `"YYYY.MM"`.
- Preserves: `SectionSubVersionsStore.density?: unknown` as input compatibility only.

- [ ] **Step 1: Inspect the WIP diff against the approved preview checklist**

Run:

```powershell
git diff -- components/resume/editor/EditorTopBar.tsx components/resume/editor/ResumeEditor.tsx components/resume/editor/ResumePreview.tsx lib/resume/date-display.ts lib/resume/density.ts lib/resume/versions.ts docs/ARCHITECTURE.md
rg -n "DensityToggle|density|YYYY\.MM|data-resume-pdf-root" components lib docs/ARCHITECTURE.md
```

Expected: the diff removes the user-facing density control, the preview root still has `data-resume-pdf-root`, and any remaining `density` occurrence is explicitly compatibility-only or historical documentation.

- [ ] **Step 2: Remove any remaining live density dependency**

The current-store shape may retain this declaration:

```ts
export interface SectionSubVersionsStore {
  schemaVersion: 1;
  sectionOrder: SectionId[];
  sectionTitles: Partial<Record<SectionId, string>>;
  dateDisplayFormat?: DateDisplayFormat;
  /** Deprecated input compatibility only; ignored by current UI. */
  density?: unknown;
  sections: Record<SectionId, SectionVersionBucket>;
}
```

But the sanitizer must construct its output without copying `raw.density`:

```ts
return {
  schemaVersion: 1,
  sectionOrder: sanitizeSectionOrder(raw.sectionOrder),
  sectionTitles: sanitizeSectionTitles(raw.sectionTitles),
  dateDisplayFormat: normalizeDateDisplayFormat(raw.dateDisplayFormat),
  sections,
};
```

Expected: no component imports `DensityToggle`; `ResumeEditor` and `ResumePreview` carry no density state or prop.

- [ ] **Step 3: Verify the preview and type boundary**

Run:

```powershell
npx tsc --noEmit
npm run lint
```

Expected: both commands exit 0; no missing `DensityToggle` import and no stale density prop error.

- [ ] **Step 4: Run the fixed-layout manual acceptance pass**

Run:

```powershell
npm run dev
```

In the editor, verify all five cases: empty resume paper, sample header/three-column rows/section rules/date format, multipage long content without horizontal overflow, centered name with and without avatar, and PDF page size/order matching the visible preview.

Expected: all five cases match `docs/superpowers/specs/2026-10-01-engineering-closeout-design.md`; stop the dev server after verification.

- [ ] **Step 5: Commit the preview closeout**

```powershell
git add components/resume/editor/EditorTopBar.tsx components/resume/editor/ResumeEditor.tsx components/resume/editor/ResumePreview.tsx components/resume/editor/DensityToggle.tsx lib/resume/date-display.ts lib/resume/density.ts lib/resume/versions.ts docs/ARCHITECTURE.md docs/superpowers/specs/2026-09-22-campus-resume-preview-design.md docs/superpowers/specs/2026-09-22-single-campus-preview-design.md
git commit -m "feat: finalize fixed campus resume preview"
```

Expected: commit contains only preview/date/density/docs WIP and does not add temp or brand assets.

---

### Task 2: Add Vitest and protect resume core pure functions

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`
- Create: `lib/resume/reorder.test.ts`
- Create: `lib/resume/versions.test.ts`
- Test: `lib/resume/reorder.ts`
- Test: `lib/resume/versions.ts`

**Interfaces:**
- Consumes: `reorderList<T>(list: readonly T[], fromIndex: number, toIndex: number): T[]`.
- Consumes: `initSectionSubVersionsStore`, `migrateLegacyVersionStore`, `sanitizeSectionSubVersionsStore`, `parseSectionSubVersionsStore`, `composeFromSectionSubVersions`, and all section-version operations from `lib/resume/versions.ts`.
- Produces: `npm test` for one-shot tests and `npm run test:watch` for interactive watch mode.

- [ ] **Step 1: Add the test runner configuration**

Add scripts and dev dependency:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^3.2.4"
  }
}
```

Create `vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    clearMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

Run:

```powershell
npm install
npx vitest --version
```

Expected: Vitest prints the installed version and exits 0.

- [ ] **Step 2: Write reorder behavior tests**

Create `lib/resume/reorder.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { reorderList } from "@/lib/resume/reorder";

describe("reorderList", () => {
  it("moves items in both directions without mutating the input", () => {
    const input = ["a", "b", "c"] as const;
    expect(reorderList(input, 2, 0)).toEqual(["c", "a", "b"]);
    expect(reorderList(input, 0, 2)).toEqual(["b", "c", "a"]);
    expect(input).toEqual(["a", "b", "c"]);
  });

  it.each([[1, 1], [-1, 1], [1, -1], [3, 1], [1, 3]])(
    "returns the original reference for invalid move %i -> %i",
    (from, to) => {
      const input = ["a", "b", "c"];
      expect(reorderList(input, from, to)).toBe(input);
    }
  );
});
```

Run:

```powershell
npm test -- lib/resume/reorder.test.ts
```

Expected: PASS; if a case fails, correct `reorderList` without changing its public signature.

- [ ] **Step 3: Write initialization, composition, migration, and sanitization tests**

Create the first part of `lib/resume/versions.test.ts` using a named fixture:

```ts
import { describe, expect, it } from "vitest";
import { emptyResumeContent } from "@/lib/resume/content";
import {
  SECTION_IDS,
  composeFromSectionSubVersions,
  initSectionSubVersionsStore,
  migrateLegacyVersionStore,
  parseSectionSubVersionsStore,
  sanitizeSectionSubVersionsStore,
} from "@/lib/resume/versions";

const content = {
  ...emptyResumeContent(),
  basic_info: { ...emptyResumeContent().basic_info, name: "小林" },
  summary: { text: "产品与数据复合背景" },
};

describe("section version store migration", () => {
  it("initializes one active default version per section and composes content", () => {
    const store = initSectionSubVersionsStore(content);
    expect(SECTION_IDS.every((id) => store.sections[id].versions.length === 1)).toBe(true);
    expect(composeFromSectionSubVersions(store)).toEqual(content);
  });

  it("migrates a legacy whole-resume snapshot", () => {
    const legacy = {
      versions: [{
        id: "legacy-1",
        name: "数据产品版",
        content,
        createdAt: "2026-10-01T00:00:00.000Z",
      }],
      compose: Object.fromEntries(SECTION_IDS.map((id) => [id, "legacy-1"])),
    } as Parameters<typeof migrateLegacyVersionStore>[0];
    const store = migrateLegacyVersionStore(legacy);
    expect(composeFromSectionSubVersions(store)).toEqual(content);
    expect(store.sections.summary.versions[0].name).toBe("数据产品版");
  });

  it("repairs incomplete duplicate order and drops deprecated density", () => {
    const base = initSectionSubVersionsStore(content);
    const store = sanitizeSectionSubVersionsStore({
      ...base,
      sectionOrder: ["work", "work", "summary", "invalid"],
      density: "compact",
    } as unknown as typeof base);
    expect(store.sectionOrder).toEqual(["work", "summary", "basic_info", "education", "project", "skills"]);
    expect(store).not.toHaveProperty("density");
    expect(parseSectionSubVersionsStore(JSON.stringify({ ...base, density: "loose" }))).not.toHaveProperty("density");
  });
});
```

Run:

```powershell
npm test -- lib/resume/versions.test.ts
```

Expected: PASS; if legacy fixture fields differ from the actual legacy interface, adjust the fixture to the existing migration input rather than widening production types.

- [ ] **Step 4: Add isolated version-operation tests**

Append tests that call the real exported operations:

```ts
import {
  addSectionSubVersion,
  deleteSectionSubVersion,
  duplicateSectionSubVersion,
  getActiveSectionVersionId,
  getSectionVersions,
  renameSectionSubVersion,
  setActiveSectionVersion,
} from "@/lib/resume/versions";

describe("section version operations", () => {
  it("creates, duplicates, switches, renames, and deletes within one section", () => {
    const initial = initSectionSubVersionsStore(content);
    const added = addSectionSubVersion(initial, "summary", "AI 产品版");
    const addedId = getActiveSectionVersionId(added, "summary");
    const duplicated = duplicateSectionSubVersion(added, "summary", addedId);
    const duplicateId = getActiveSectionVersionId(duplicated, "summary");
    const renamed = renameSectionSubVersion(duplicated, "summary", duplicateId, "数据产品版");
    const switched = setActiveSectionVersion(renamed, "summary", addedId);
    const deleted = deleteSectionSubVersion(switched, "summary", duplicateId);

    expect(getSectionVersions(deleted, "summary").map((v) => v.name)).toContain("AI 产品版");
    expect(getSectionVersions(deleted, "summary").map((v) => v.name)).not.toContain("数据产品版");
    expect(getActiveSectionVersionId(deleted, "summary")).toBe(addedId);
    expect(deleted.sections.work).toEqual(initial.sections.work);
  });

  it("keeps the last version in a section", () => {
    const initial = initSectionSubVersionsStore(content);
    const onlyId = getActiveSectionVersionId(initial, "work");
    expect(deleteSectionSubVersion(initial, "work", onlyId)).toBe(initial);
  });
});
```

Run:

```powershell
npm test
npm run lint
```

Expected: all tests pass and lint exits 0.

- [ ] **Step 5: Commit the test safety net**

```powershell
git add package.json package-lock.json vitest.config.ts lib/resume/reorder.test.ts lib/resume/versions.test.ts
git commit -m "test: add resume core unit coverage"
```

---

### Task 3: Extract and test the shared DeepSeek JSON client

**Files:**
- Create: `lib/ai/deepseek-client.ts`
- Create: `lib/ai/deepseek-client.test.ts`
- Modify: `lib/ai/deepseek.ts`
- Modify: `lib/ai/edit-section.ts`
- Modify: `lib/ai/jd-check.ts`

**Interfaces:**
- Produces: `resolveDeepseekApiKey(userKey?: string | null): string`.
- Produces: `requestDeepseekJson<T>(options: DeepseekJsonRequestOptions): Promise<T>`.
- Produces: `AIError` with `status: number`.
- Preserves: feature-specific prompts, temperatures, JSON normalization, `EditSectionResult`, `ParseResult`, and `JdCheckResult`.

- [ ] **Step 1: Write failing transport tests**

Create `lib/ai/deepseek-client.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { AIError, requestDeepseekJson } from "@/lib/ai/deepseek-client";

const errors = {
  timeout: "请求超时",
  connection: "连接失败",
  empty: "响应为空",
  invalidJson: "JSON 非法",
};

function response(content: string, ok = true, status = 200) {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("requestDeepseekJson", () => {
  it.each([
    ['{"ok":true}'],
    ['```json\\n{"ok":true}\\n```'],
  ])("parses JSON response %s", async (content) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(content)));
    await expect(requestDeepseekJson<{ ok: boolean }>({
      apiKey: "key",
      systemPrompt: "system",
      userPrompt: "user",
      temperature: 0.2,
      errors,
    })).resolves.toEqual({ ok: true });
  });

  it("maps HTTP, empty, and invalid JSON responses", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("denied", { status: 401 }))
      .mockResolvedValueOnce(response(""))
      .mockResolvedValueOnce(response("not-json"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestDeepseekJson({ apiKey: "key", systemPrompt: "s", userPrompt: "u", errors })).rejects.toMatchObject({ status: 502 });
    await expect(requestDeepseekJson({ apiKey: "key", systemPrompt: "s", userPrompt: "u", errors })).rejects.toEqual(new AIError("响应为空", 502));
    await expect(requestDeepseekJson({ apiKey: "key", systemPrompt: "s", userPrompt: "u", errors })).rejects.toEqual(new AIError("JSON 非法", 502));
  });

  it("maps an aborted request to the feature timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));
    const request = requestDeepseekJson({ apiKey: "key", systemPrompt: "s", userPrompt: "u", timeoutMs: 10, errors });
    await vi.advanceTimersByTimeAsync(10);
    await expect(request).rejects.toEqual(new AIError("请求超时", 504));
  });
});
```

Run:

```powershell
npm test -- lib/ai/deepseek-client.test.ts
```

Expected: FAIL because `lib/ai/deepseek-client.ts` does not exist.

- [ ] **Step 2: Implement the typed client**

Create `lib/ai/deepseek-client.ts` with this public shape:

```ts
export class AIError extends Error {
  constructor(public readonly message: string, public readonly status = 502) {
    super(message);
    this.name = "AIError";
  }
}

export interface DeepseekJsonErrors {
  timeout: string;
  connection: string;
  empty: string;
  invalidJson: string;
}

export interface DeepseekJsonRequestOptions {
  apiKey?: string | null;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  timeoutMs?: number;
  errors: DeepseekJsonErrors;
}

export function resolveDeepseekApiKey(userKey?: string | null): string {
  const apiKey = userKey?.trim() || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new AIError("请先在设置中配置 DeepSeek API Key", 503);
  return apiKey;
}

export async function requestDeepseekJson<T>({
  apiKey: userKey,
  systemPrompt,
  userPrompt,
  temperature = 0.2,
  timeoutMs = 60_000,
  errors,
}: DeepseekJsonRequestOptions): Promise<T> {
  const apiKey = resolveDeepseekApiKey(userKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${process.env.DEEPSEEK_API_URL || "https://api.deepseek.com"}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new AIError(errors.timeout, 504);
    throw new AIError(errors.connection, 502);
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new AIError(`DeepSeek 返回错误（${response.status}）${detail ? `: ${detail.slice(0, 200)}` : ""}`, 502);
  }
  const envelope = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = envelope.choices?.[0]?.message?.content;
  if (!raw) throw new AIError(errors.empty, 502);
  try {
    const cleaned = raw.trim().startsWith("```")
      ? raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim()
      : raw.trim();
    return JSON.parse(cleaned) as T;
  } catch {
    throw new AIError(errors.invalidJson, 502);
  }
}
```

Run:

```powershell
npm test -- lib/ai/deepseek-client.test.ts
```

Expected: all transport tests pass without a real network request.

- [ ] **Step 3: Migrate resume parsing to the shared client**

Keep the parse prompt and normalization in `lib/ai/deepseek.ts`, re-export the error for route compatibility, and replace transport code with:

```ts
import {
  AIError,
  requestDeepseekJson,
} from "@/lib/ai/deepseek-client";
export { AIError } from "@/lib/ai/deepseek-client";

const parsed = await requestDeepseekJson<{
  title?: string;
  content?: Partial<ResumeContent>;
}>({
  apiKey: options?.apiKey,
  systemPrompt: SYSTEM_PROMPT,
  userPrompt: `以下是简历原始文本：\n\n${text.slice(0, 20000)}`,
  temperature: 0.2,
  errors: {
    timeout: "解析超时，请稍后重试",
    connection: "无法连接 DeepSeek 服务",
    empty: "DeepSeek 未返回有效内容",
    invalidJson: "解析结果不是合法 JSON",
  },
});
```

Expected: `parseResumeText` still returns normalized content and its original title fallback.

- [ ] **Step 4: Migrate section editing and JD checking**

Use the same client in `lib/ai/edit-section.ts` with temperature `0.7` and errors:

```ts
const suggested = await requestDeepseekJson<unknown>({
  apiKey: userApiKey,
  systemPrompt: buildSystemPrompt(target),
  userPrompt: buildUserPrompt(target, content, instruction),
  temperature: 0.7,
  errors: {
    timeout: "AI 编辑超时，请稍后重试",
    connection: "无法连接 DeepSeek 服务",
    empty: "DeepSeek 未返回有效内容",
    invalidJson: "AI 返回不是合法 JSON",
  },
});
```

Use it in `lib/ai/jd-check.ts` with temperature `0.3` and errors:

```ts
const parsed = await requestDeepseekJson<{ issues?: unknown }>({
  apiKey: params.apiKey,
  systemPrompt: SYSTEM_PROMPT,
  userPrompt,
  temperature: 0.3,
  errors: {
    timeout: "检查超时，请稍后重试",
    connection: "无法连接 DeepSeek 服务",
    empty: "DeepSeek 未返回有效内容",
    invalidJson: "检查结果不是合法 JSON",
  },
});
```

Expected: prompts and all post-parse business validation remain in their original feature files; duplicate `fetch`, timeout, envelope parsing, and code-fence helpers are removed.

- [ ] **Step 5: Verify and commit the AI refactor**

Run:

```powershell
npm test
npx tsc --noEmit
npm run lint
rg -n "fetch\(|stripCodeFence|AbortController" lib/ai
```

Expected: tests/typecheck/lint pass; the final search finds shared transport implementation only.

```powershell
git add lib/ai/deepseek-client.ts lib/ai/deepseek-client.test.ts lib/ai/deepseek.ts lib/ai/edit-section.ts lib/ai/jd-check.ts
git commit -m "refactor: share DeepSeek JSON client"
```

---

### Task 4: Extract editor persistence, version, and AI hooks

**Files:**
- Create: `components/resume/editor/hooks/useResumePersistence.ts`
- Create: `components/resume/editor/hooks/useResumeVersions.ts`
- Create: `components/resume/editor/hooks/useResumeAIEdit.ts`
- Modify: `components/resume/editor/ResumeEditor.tsx`

**Interfaces:**
- Produces: `useResumePersistence(options): UseResumePersistenceResult`.
- Produces: `useResumeVersions(store, setStore): UseResumeVersionsResult`.
- Produces: `useResumeAIEdit(options): UseResumeAIEditResult`.
- Consumes: unchanged server actions, local-storage helpers, version pure functions, and AI client helpers.

- [ ] **Step 1: Extract `useResumePersistence` without changing behavior**

Create a hook with these exact option/result contracts:

```ts
interface UseResumePersistenceOptions {
  id: string;
  title: string;
  initialContent: ResumeContent | null;
  initialVersionStore?: SectionSubVersionsStore | null;
  serverUpdatedAt?: string | null;
}

interface UseResumePersistenceResult {
  store: SectionSubVersionsStore | null;
  setStore: Dispatch<SetStateAction<SectionSubVersionsStore | null>>;
  resumeTitle: string;
  saveState: SaveState;
  retrySave: () => void;
  updateResumeTitle: (nextTitle: string) => Promise<void>;
}
```

Move `isLocalNewer`, `persistLocalDraft`, initial hydration, `saveNow`, the 800 ms debounced save, retry, and title update into this hook. Preserve the existing precedence exactly: newer local store, server version store, local store, then initialized flat content.

Run:

```powershell
npx tsc --noEmit
npm run lint
```

Expected: both pass; refresh and local-newer recovery still use the same storage keys and server actions.

- [ ] **Step 2: Extract `useResumeVersions` as network-free orchestration**

Use this exact result contract:

```ts
interface UseResumeVersionsResult {
  composedContent: ResumeContent;
  sectionOrder: SectionId[];
  dateDisplayFormat: DateDisplayFormat;
  updateStore: (updater: (store: SectionSubVersionsStore) => SectionSubVersionsStore) => void;
  updateSection: (sectionId: SectionId, next: ResumeContent) => void;
  getSectionCardContent: (sectionId: SectionId) => ResumeContent;
  setActiveVersion: (sectionId: SectionId, versionId: string) => void;
  createVersion: (sectionId: SectionId, name: string) => void;
  renameVersion: (sectionId: SectionId, versionId: string, name: string) => void;
  duplicateVersion: (sectionId: SectionId, versionId: string) => void;
  deleteVersion: (sectionId: SectionId, versionId: string) => void;
  moveSection: (sectionId: SectionId, direction: -1 | 1) => void;
  updateSectionTitle: (sectionId: SectionId, title: string) => void;
  updateDateDisplayFormat: (format: DateDisplayFormat) => void;
}
```

The hook receives only:

```ts
export function useResumeVersions(
  store: SectionSubVersionsStore | null,
  setStore: Dispatch<SetStateAction<SectionSubVersionsStore | null>>
): UseResumeVersionsResult
```

Expected: the hook imports no server action or local-storage module; it delegates all mutations to `lib/resume/versions.ts`.

- [ ] **Step 3: Extract `useResumeAIEdit` with active-version-only acceptance**

Use these contracts:

```ts
interface UseResumeAIEditOptions {
  store: SectionSubVersionsStore | null;
  composedContent: ResumeContent;
  updateStore: (updater: (store: SectionSubVersionsStore) => SectionSubVersionsStore) => void;
}

interface UseResumeAIEditResult {
  aiOpenSections: Record<string, boolean>;
  bulletAIOpen: { sectionId: "work" | "project" | "education"; entryIndex: number; bulletIndex: number } | null;
  pendingAIEdit: PendingAIEdit | null;
  aiModalMeta: { target: EditTarget; title: string; subtitle: string; placeholder: string; originalContent: unknown } | null;
  toggleSectionAI: (sectionId: SectionId) => void;
  toggleBulletAI: (sectionId: "work" | "project" | "education", entryIndex: number, bulletIndex: number) => void;
  runAIEdit: (target: EditTarget, instruction: string) => Promise<void>;
  submitAIEdit: (instruction: string) => void;
  acceptAIEdit: () => void;
  rejectAIEdit: () => void;
  closeAIEdit: () => void;
  optimizeSection: (sectionId: SectionId, instruction: string) => void;
}
```

Acceptance must retain this invariant:

```ts
if (!pendingAIEdit || !store || pendingAIEdit.status !== "ready") return;
const updated = applyAIEdit(currentSection, pendingAIEdit.target, pendingAIEdit.suggested);
updateStore((current) =>
  updateActiveSectionContent(
    current,
    pendingAIEdit.target.sectionId,
    updated[pendingAIEdit.target.sectionId]
  )
);
```

Expected: request failures only set modal error state and never modify store content.

- [ ] **Step 4: Reduce `ResumeEditor` to composition and view wiring**

The top-level composition should follow this shape:

```ts
const persistence = useResumePersistence({
  id,
  title,
  initialContent,
  initialVersionStore,
  serverUpdatedAt,
});
const versions = useResumeVersions(persistence.store, persistence.setStore);
const ai = useResumeAIEdit({
  store: persistence.store,
  composedContent: versions.composedContent,
  updateStore: versions.updateStore,
});
```

Keep only layout, PDF export state/function, `getEditorSectionsInOrder`, and prop wiring in `ResumeEditor`. Do not introduce context or a global store.

Run:

```powershell
npx tsc --noEmit
npm run lint
```

Expected: both pass; `ResumeEditor.tsx` no longer imports server actions, local-storage helpers, AI request/apply helpers, or individual version mutation helpers.

- [ ] **Step 5: Run editor regression checks**

Run:

```powershell
npm test
npm run dev
```

Manually verify: initial hydration, refresh recovery, 800 ms autosave, retry after a simulated save failure, title rename, section reorder/title/date change, create/duplicate/switch/rename/delete version, section AI, bullet AI, accept/reject/error Diff flows, JD-panel optimize, and PDF export.

Expected: all flows match pre-refactor behavior; stop the dev server.

- [ ] **Step 6: Commit the hook extraction**

```powershell
git add components/resume/editor/hooks/useResumePersistence.ts components/resume/editor/hooks/useResumeVersions.ts components/resume/editor/hooks/useResumeAIEdit.ts components/resume/editor/ResumeEditor.tsx
git commit -m "refactor: extract resume editor hooks"
```

---

### Task 5: Upgrade Supabase client and eliminate the middleware warning

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Verify unchanged behavior: `lib/supabase/middleware.ts`
- Verify unchanged behavior: `middleware.ts`
- Modify if needed: `docs/ARCHITECTURE.md`

**Interfaces:**
- Consumes: existing cookie-based `createServerClient` middleware flow.
- Produces: dependency declaration `"@supabase/supabase-js": "^2.110.5"` with lockfile resolution at or above `2.110.5`.
- Preserves: `@supabase/ssr` declaration `^0.5.2`, anonymous session creation, cookie refresh, and route redirection.

- [ ] **Step 1: Record the current warning before the upgrade**

Run:

```powershell
npm run build 2>&1 | Tee-Object -FilePath "$env:TEMP\resumekit-build-before.log"
Select-String -Path "$env:TEMP\resumekit-build-before.log" -Pattern "process.version|Edge Runtime"
```

Expected before upgrade: build exits 0 and the search shows the known Supabase `process.version` Edge Runtime warning.

- [ ] **Step 2: Upgrade only the Supabase JavaScript client**

Run:

```powershell
npm install @supabase/supabase-js@^2.110.5
npm ls @supabase/supabase-js @supabase/ssr
```

Expected: installed `@supabase/supabase-js` is `2.110.5` or newer within major 2; `@supabase/ssr` remains on the declared `^0.5.2` line. Do not alter middleware code merely to silence static analysis.

- [ ] **Step 3: Verify the production build and warning removal**

Run:

```powershell
npm run build 2>&1 | Tee-Object -FilePath "$env:TEMP\resumekit-build-after.log"
Select-String -Path "$env:TEMP\resumekit-build-after.log" -Pattern "process.version|Edge Runtime"
```

Expected: build exits 0 and `Select-String` returns no matches.

- [ ] **Step 4: Run the complete automated gate and auth smoke test**

Run:

```powershell
npm test
npm run lint
npm run build
```

Then start the production server and verify one anonymous visit: the session cookie is created/refreshed and the same home/dashboard/editor redirect path is followed.

Expected: all commands pass and auth behavior is unchanged.

- [ ] **Step 5: Document and commit the resolved warning**

If `docs/ARCHITECTURE.md` has a known-warning section, replace the warning with the exact resolution: Supabase JS minimum `2.110.5`; SSR remains `0.5.2`. Then commit:

```powershell
git add package.json package-lock.json docs/ARCHITECTURE.md
git commit -m "chore: update Supabase client"
```

Expected: no middleware implementation file is included unless a real compatibility adjustment was required and separately explained in the commit.

---

### Task 6: Final verification and user-gated workspace cleanup

**Files:**
- Modify: `.gitignore`
- Candidate delete after fresh user confirmation: `.tmp-docx-template/`
- Candidate delete after fresh user confirmation: `.tmp-docx-template.zip`
- Candidate delete after fresh user confirmation: `.superpowers/`
- Preserve: `output/`
- Preserve: `.agents/`
- Preserve: `skills-lock.json`

**Interfaces:**
- Consumes: all preceding commits and the approved cleanup boundary.
- Produces: a clean, reproducible build and a separately reviewable cleanup commit only after explicit user confirmation.

- [ ] **Step 1: Add narrow ignore rules without deleting files**

Append only these rules if they are not already present:

```gitignore
# Local agent brainstorming sessions and extracted document scratch files
.superpowers/
.tmp-docx-template/
.tmp-docx-template.zip
```

Run:

```powershell
git diff -- .gitignore
git check-ignore -v .superpowers .tmp-docx-template .tmp-docx-template.zip
```

Expected: all three candidates are ignored by the new narrow rules; `output/`, `.agents/`, and `skills-lock.json` are not covered by these rules.

- [ ] **Step 2: Run the full release gate**

Run:

```powershell
npm test
npm run lint
npm run build
git status --short
```

Expected: all commands pass; build output has no Supabase `process.version` Edge Runtime warning; status contains no accidental `.env.local`, `output/`, `.agents/`, or `skills-lock.json` staging.

- [ ] **Step 3: Present the exact deletion list and wait**

Report these candidates to the user with recovery implications:

```text
.tmp-docx-template/     extracted temporary DOCX contents
.tmp-docx-template.zip temporary DOCX archive
.superpowers/           local brainstorming companion session files
```

Expected: do not delete anything in this step. Wait for a new explicit confirmation from the user.

- [ ] **Step 4: Delete only after the fresh confirmation**

Resolve and verify each absolute target is under `E:\graduateschool\resume`, then run in PowerShell:

```powershell
Remove-Item -LiteralPath 'E:\graduateschool\resume\.tmp-docx-template' -Recurse -Force
Remove-Item -LiteralPath 'E:\graduateschool\resume\.tmp-docx-template.zip' -Force
Remove-Item -LiteralPath 'E:\graduateschool\resume\.superpowers' -Recurse -Force
```

Expected: only the three confirmed candidates are removed; `output/`, `.agents/`, and `skills-lock.json` remain.

- [ ] **Step 5: Verify and commit cleanup metadata**

Run:

```powershell
Test-Path 'E:\graduateschool\resume\.tmp-docx-template'
Test-Path 'E:\graduateschool\resume\.tmp-docx-template.zip'
Test-Path 'E:\graduateschool\resume\.superpowers'
Test-Path 'E:\graduateschool\resume\output'
Test-Path 'E:\graduateschool\resume\.agents'
Test-Path 'E:\graduateschool\resume\skills-lock.json'
git status --short
```

Expected: first three results are `False`; final three results are `True`.

```powershell
git add .gitignore
git commit -m "chore: ignore local scratch files"
```

Expected: the final commit contains only `.gitignore` because the deleted candidates were untracked local scratch artifacts.

---

## Completion Gate

- [ ] Fixed campus preview passes the five manual acceptance scenarios.
- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass.
- [ ] Production build output contains no Supabase `process.version` Edge Runtime warning.
- [ ] Parse, edit, and JD-check preserve success, missing-key, timeout, connection, non-2xx, empty-response, and invalid-JSON semantics.
- [ ] Autosave, local fallback, refresh recovery, title editing, section version operations, AI Diff actions, and PDF export pass regression checks.
- [ ] `ResumeEditor.tsx` contains view composition and PDF wiring, not persistence/versions/AI state-machine implementations.
- [ ] Architecture and preview documentation match current code.
- [ ] No cleanup candidate is deleted without the final fresh user confirmation.
