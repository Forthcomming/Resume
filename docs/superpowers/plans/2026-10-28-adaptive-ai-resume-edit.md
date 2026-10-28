# Adaptive AI Resume Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让普通简历 AI 优化在信息充分时直接生成高质量建议，在关键事实不足时自适应追问，并继续通过现有 Diff 由用户决定是否采纳。

**Architecture:** 保留现有 `requestAIEdit` 一步生成接口供 JD 定制重试使用，新增 `requestAdaptiveAIEdit` 驱动编辑器两阶段流程。服务端用可判别联合类型清洗 DeepSeek 结果；编辑器 hook 维护分析、追问、生成、Diff 状态；弹窗新增独立追问表单。

**Tech Stack:** Next.js 14 Route Handler、React 18、TypeScript、DeepSeek JSON API、Vitest

## Global Constraints

- 普通优化只读取当前编辑切片和用户指令，不读取 JD、目标职位或其他简历板块。
- 首次请求可返回 `ready` 或 `needs_input`；补充信息请求只能返回 `ready`。
- 追问最多 3 条；用户可跳过并选择保守优化。
- 不得新增原文或用户回答中不存在的事实、数字与因果关系。
- 不修改板块版本、保存、预览、PDF、BYOK 和 DeepSeek 公共请求层。
- 保持 `/resume/[id]/tailor` 的现有一步重写行为。
- 不修改 `redcowork-demo/` 副本。

---

### Task 1: 定义并验证自适应 AI 结果契约

**Files:**
- Modify: `types/ai-edit.ts`
- Modify: `lib/ai/edit-section.ts`
- Create: `lib/ai/edit-section.test.ts`

**Interfaces:**
- Produces:
  - `AIEditReadyResult`
  - `AIEditNeedsInputResult`
  - `AIEditResult`
  - `AIEditAnswers`
  - `sanitizeAdaptiveEditResult(raw, original, followUp): AIEditResult`
  - `editSectionContent(params)` 保持现有一步生成
  - `editSectionContentAdaptive(params): Promise<AIEditResult>`

- [ ] **Step 1: 先写结果清洗失败测试**

在 `lib/ai/edit-section.test.ts` 覆盖：

```ts
it("limits clarification questions and rebuilds stable ids", () => {
  expect(
    sanitizeAdaptiveEditResult(
      {
        status: "needs_input",
        diagnosis: "缺少结果依据",
        questions: [
          { question: "最终产生了什么结果？" },
          { question: "你采取了什么具体动作？" },
          { question: "你本人负责哪部分？" },
          { question: "多余问题" },
        ],
      },
      original,
      false
    )
  ).toMatchObject({
    status: "needs_input",
    questions: [
      { id: "question-1" },
      { id: "question-2" },
      { id: "question-3" },
    ],
  });
});

it("rejects follow-up responses that ask again", () => {
  expect(() =>
    sanitizeAdaptiveEditResult(
      { status: "needs_input", diagnosis: "仍需信息", questions: [] },
      original,
      true
    )
  ).toThrow("补充信息后仍未生成有效建议");
});

it("rejects an unchanged suggestion", () => {
  expect(() =>
    sanitizeAdaptiveEditResult(
      { status: "ready", suggested: original, improvements: ["调整表达"] },
      original,
      false
    )
  ).toThrow("AI 建议与原文没有实质差异");
});
```

同时覆盖空问题过滤、改进说明最多 3 条、`ready` 缺少 `suggested`、顶层结构不兼容。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- lib/ai/edit-section.test.ts`  
Expected: FAIL，提示导出的类型或清洗函数不存在。

- [ ] **Step 3: 实现最小类型契约**

在 `types/ai-edit.ts` 新增：

```ts
export type AIEditAnswers = Record<string, string>;

export type AIEditReadyResult = {
  status: "ready";
  original: unknown;
  suggested: unknown;
  improvements: string[];
};

export type AIEditNeedsInputResult = {
  status: "needs_input";
  original: unknown;
  diagnosis: string;
  questions: Array<{
    id: string;
    question: string;
    placeholder?: string;
  }>;
};

export type AIEditResult = AIEditReadyResult | AIEditNeedsInputResult;
```

把 `PendingAIEdit` 改成能表达以下 UI 状态的联合类型：

```ts
type PendingAIEdit =
  | { status: "analyzing"; target: EditTarget; instruction: string; original: unknown }
  | ({ target: EditTarget; instruction: string } & AIEditNeedsInputResult)
  | ({ target: EditTarget; instruction: string; status: "generating"; original: unknown })
  | ({ target: EditTarget; instruction: string } & AIEditReadyResult)
  | { status: "error"; target: EditTarget; instruction: string; original: unknown; error: string };
```

- [ ] **Step 4: 实现服务端清洗与提示词**

在 `lib/ai/edit-section.ts`：

- 保留 `editSectionContent` 的现有签名和一步生成语义，避免影响 `TailorWorkspace`。
- 新增 `sanitizeAdaptiveEditResult`，过滤空问题、重建问题 ID、限制数组长度、检查 `JSON.stringify(suggested) !== JSON.stringify(original)`。
- 校验建议的顶层结构与原文一致：对象/数组类型一致；对象必须包含原文已有顶层 key。
- 新增 `editSectionContentAdaptive`：

```ts
type AdaptiveEditParams = EditSectionParams & {
  answers?: AIEditAnswers;
  conservative?: boolean;
};
```

- 无 `answers` 且非 `conservative`：允许模型返回 `ready | needs_input`。
- 有回答或 `conservative=true`：强制返回 `ready`。
- 提示词明确使用“行动、对象、方法、结果”，禁止同义替换、套话和虚构。
- 保守优化明确只能重组原有事实，不得暗示缺失结果。

- [ ] **Step 5: 运行目标测试**

Run: `npm test -- lib/ai/edit-section.test.ts`  
Expected: PASS。

- [ ] **Step 6: 提交契约与服务端核心**

```bash
git add types/ai-edit.ts lib/ai/edit-section.ts lib/ai/edit-section.test.ts
git commit -m "feat: add adaptive AI edit contract"
```

---

### Task 2: 扩展 API，同时保持 JD 定制兼容

**Files:**
- Modify: `app/api/resume/edit/route.ts`
- Modify: `lib/ai/client-edit.ts`

**Interfaces:**
- Consumes: `editSectionContentAdaptive`, `AIEditAnswers`, `AIEditResult`
- Produces:

```ts
requestAdaptiveAIEdit(
  target: EditTarget,
  content: unknown,
  instruction: string,
  options?: { answers?: AIEditAnswers; conservative?: boolean }
): Promise<AIEditResult>
```

- [ ] **Step 1: 扩展 Route Handler 请求分流**

请求体增加：

```ts
workflow?: "adaptive";
answers?: AIEditAnswers;
conservative?: boolean;
```

处理规则：

- `workflow !== "adaptive"`：继续调用 `editSectionContent`，返回原有 `{ original, suggested }`。
- `workflow === "adaptive"`：调用 `editSectionContentAdaptive`。
- 清理回答：只保留字符串值并 `trim()`；限制最多 3 项。
- `answers` 和 `conservative` 均未提供时视为首次分析。

- [ ] **Step 2: 新增客户端自适应请求函数**

保持 `requestAIEdit` 不变，新增：

```ts
export async function requestAdaptiveAIEdit(
  target: EditTarget,
  content: unknown,
  instruction: string,
  options: {
    answers?: AIEditAnswers;
    conservative?: boolean;
  } = {}
): Promise<AIEditResult>
```

请求体固定携带 `workflow: "adaptive"`。复用现有 BYOK headers 和错误提取。

- [ ] **Step 3: 验证兼容性**

Run: `npm test -- lib/ai/edit-section.test.ts lib/ai/deepseek-client.test.ts`  
Expected: PASS。

Run: `npm run lint`  
Expected: 无 `requestAIEdit` 返回类型或 Route Handler 类型错误。

- [ ] **Step 4: 提交 API 接线**

```bash
git add app/api/resume/edit/route.ts lib/ai/client-edit.ts
git commit -m "feat: expose adaptive AI edit API"
```

---

### Task 3: 将编辑器状态机接入自适应流程

**Files:**
- Modify: `components/resume/editor/hooks/useResumeAIEdit.ts`
- Modify: `components/resume/editor/ResumeEditor.tsx`

**Interfaces:**
- Consumes: `requestAdaptiveAIEdit`, `AIEditAnswers`
- Produces:
  - `submitAIClarification(answers: AIEditAnswers): void`
  - `submitConservativeAIEdit(): void`

- [ ] **Step 1: 初次请求切换为自适应接口**

在 `runAIEdit` 中：

- 请求前写入 `status: "analyzing"`。
- 调用 `requestAdaptiveAIEdit`。
- 返回 `needs_input` 时保留 `target`、`instruction`、`original`、`diagnosis`、`questions`。
- 返回 `ready` 时进入现有 Diff。
- 异常时进入 `error`，且不修改 store。

- [ ] **Step 2: 增加回答与保守生成动作**

新增内部统一方法：

```ts
generateAfterClarification(options: {
  answers?: AIEditAnswers;
  conservative?: boolean;
}): Promise<void>
```

要求：

- 仅在当前状态为 `needs_input` 时执行。
- 请求期间切换为 `generating`。
- 复用首次请求保存的 `target`、`instruction` 和 `original`。
- 只接受 `ready`；异常进入 `error`。

公开 `submitAIClarification` 和 `submitConservativeAIEdit`。

- [ ] **Step 3: 收紧采纳条件**

`acceptAIEdit` 只处理 `status === "ready"`；现有 entry 版本和普通 section 写回逻辑不变。关闭、拒绝、切换目标时清空整个自适应会话。

- [ ] **Step 4: 在 `ResumeEditor` 透传新动作**

向 `AIModal` 增加：

```tsx
onSubmitClarification={ai.submitAIClarification}
onSubmitConservative={ai.submitConservativeAIEdit}
```

不调整保存、版本和 JD 定制入口。

- [ ] **Step 5: 静态验证**

Run: `npm run lint`  
Expected: PASS；`TailorWorkspace.tsx` 继续使用原有 `requestAIEdit`，无需修改。

- [ ] **Step 6: 提交状态机**

```bash
git add components/resume/editor/hooks/useResumeAIEdit.ts components/resume/editor/ResumeEditor.tsx
git commit -m "feat: add adaptive AI edit state flow"
```

---

### Task 4: 增加追问表单和改进说明

**Files:**
- Create: `components/resume/editor/AIClarificationForm.tsx`
- Modify: `components/resume/editor/AIModal.tsx`
- Modify: `components/resume/editor/sections.ts`

**Interfaces:**
- Consumes: `AIEditNeedsInputResult["questions"]`, `AIEditAnswers`
- Produces:

```ts
AIClarificationForm({
  diagnosis,
  questions,
  onSubmit,
  onConservative,
}: {
  diagnosis: string;
  questions: AIEditNeedsInputResult["questions"];
  onSubmit: (answers: AIEditAnswers) => void;
  onConservative: () => void;
})
```

- [ ] **Step 1: 新建追问表单**

实现要求：

- 显示诊断文字和最多 3 个输入框。
- 本地 state 以问题 ID 为 key。
- 至少一个非空回答时才启用“根据补充信息生成”。
- “暂不补充，保守优化”始终可用。
- 不把 placeholder 当成真实回答提交。

- [ ] **Step 2: 扩展 `AIModal` 状态展示**

- `analyzing`：文案“AI 正在判断哪些信息足以支持改写…”。
- `needs_input`：渲染 `AIClarificationForm`。
- `generating`：文案“AI 正在根据补充事实生成建议…”。
- `ready`：在 `AIDiffView` 上方展示最多 3 条“本次改进”。
- `error`：沿用现有错误卡和返回重新输入行为。

首次输入、原文展示、Escape 关闭、Portal 与 body scroll lock 保持不变。

- [ ] **Step 3: 收紧快捷指令文案**

把 `AI_QUICK_PROMPTS` 改为更具体的目标：

```ts
export const AI_QUICK_PROMPTS = [
  "突出我的具体动作和结果",
  "删除空话，提高信息密度",
  "重组表达，但不要补写事实",
];
```

- [ ] **Step 4: 验证前端类型与构建**

Run: `npm run lint`  
Expected: PASS。

Run: `npm run build`  
Expected: PASS；无 `PendingAIEdit` 分支遗漏。

- [ ] **Step 5: 提交 UI**

```bash
git add components/resume/editor/AIClarificationForm.tsx components/resume/editor/AIModal.tsx components/resume/editor/sections.ts
git commit -m "feat: add AI clarification UI"
```

---

### Task 5: 全链路回归验收

**Files:**
- Verify only

- [ ] **Step 1: 运行自动验证**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: 全部退出码为 0。

- [ ] **Step 2: 手动验证直接生成**

选择信息充分的 bullet，输入“删除空话，提高信息密度”。确认：

- 只出现一次分析 loading。
- 直接进入 Diff。
- 显示具体改进点。
- 采纳后只修改目标 entry 版本。

- [ ] **Step 3: 手动验证自适应追问**

选择只有“负责产品设计”的 bullet，输入“量化成果，突出个人贡献”。确认：

- 返回 1～3 个与行动、个人贡献或结果有关的问题。
- 回答后进入生成 loading，再显示 Diff。
- 建议只使用原文和回答中的事实。

- [ ] **Step 4: 手动验证保守优化与取消**

- 在追问页不填写答案，点击“暂不补充，保守优化”，确认结果不新增数字或事实。
- 在分析、追问、生成和 Diff 阶段分别关闭弹窗，确认简历内容不变。
- 拒绝建议后确认版本内容不变。

- [ ] **Step 5: 回归 JD 定制重试**

进入 `/resume/[id]/tailor`，对一条改写建议执行重新生成。确认仍走一步生成，不出现追问状态，且建议可正常写回适配方案。

- [ ] **Step 6: 检查提交范围**

Run: `git status --short`  
Expected: 没有 `.env.local`、`redcowork-demo/`、`.agents/` 或无关文件被暂存。
