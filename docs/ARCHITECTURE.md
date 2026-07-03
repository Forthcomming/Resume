# ARCHITECTURE — ResumeKit

> 本文档基于 `docs/resume-optimizer-prd.md`，用于约束 ResumeKit 的后续实现、页面拆分、数据结构、服务层边界与验收标准。后续 UI 稿逐页实现时，应优先遵循本文档，再结合具体设计稿补充页面细节。

## 1. 产品定位

ResumeKit 是一个模块化简历优化工具，目标是把简历从单个文档转化为「结构化板块库 + 多版本管理 + 动态组合导出」的工作流。

核心闭环：

1. 上传或新建简历。
2. 解析为结构化板块。
3. 编辑单个板块，支持自然语言改写。
4. 保存板块多版本。
5. 根据目标 JD 生成核心优势。
6. 选择板块版本组合并导出 PDF。

MVP 优先保证该闭环完整可用，样式、模板数量、复杂评分系统均不应优先于主流程稳定性。

## 2. 技术栈

### 2.1 前端

- Next.js 14 App Router。
- React Server Components 优先用于页面级数据装配和导出模板 HTML 生成。
- TypeScript 全量类型约束。
- Zustand 管理编辑器本地交互状态。
- SWR 或 React Query 管理服务端数据缓存、重新验证和 optimistic update。
- 桌面端优先，不以移动端适配作为 MVP 目标。

### 2.2 后端与存储

- Supabase Auth：邮箱登录。
- Supabase PostgreSQL：核心业务数据。
- Supabase Storage：上传原始文件可选，MVP 倾向只持久化解析后的 JSON，不保存原文件。
- Next.js Route Handlers：承载 `/api/*` 服务接口。

### 2.3 AI 与导出

- Anthropic Claude API：简历解析、自然语言编辑、JD 核心优势生成。
- Puppeteer：将固定 HTML 简历模板渲染为 PDF。
- PDF 模板：MVP 只提供一套干净单栏模板。

## 3. 推荐目录结构

```text
app/
  (auth)/
    page.tsx
  dashboard/
    page.tsx
  resume/
    new/
      page.tsx
    [id]/
      page.tsx
      export/
        page.tsx
  api/
    parse/
      route.ts
    edit/
      route.ts
    advantage/
      route.ts
    export/
      route.ts

components/
  layout/
  resume/
    editor/
    sections/
    versions/
    export/
  ui/

lib/
  ai/
    client.ts
    prompts.ts
    parse-resume.ts
    edit-section.ts
    generate-advantage.ts
  export/
    render-resume-html.tsx
    pdf.ts
  resume/
    schema.ts
    serializers.ts
    validators.ts
  supabase/
    client.ts
    server.ts
    admin.ts

services/
  resumes.ts
  sections.ts
  section-versions.ts
  export-schemes.ts

store/
  editor-store.ts

types/
  resume.ts

docs/
  resume-optimizer-prd.md
  resumekit-design-system-vyra.md
```

目录约定：

- `app/` 只负责路由、页面装配和 API 入口，不直接堆业务逻辑。
- `components/` 负责展示与局部交互，不直接调用 Supabase Admin 或 Claude。
- `services/` 封装业务级数据操作，作为页面、API 与数据库之间的边界。
- `lib/ai/` 封装模型调用、Prompt 模板、响应解析和错误处理。
- `lib/export/` 封装 HTML 简历模板与 PDF 渲染。
- `types/` 或 `lib/resume/schema.ts` 维护跨层共享的数据类型与 schema。

## 4. 页面结构

### 4.1 路由

- `/`：Landing / 登录入口。
- `/dashboard`：简历列表，展示所有简历卡片。
- `/resume/new`：新建简历，支持上传文件或从零创建。
- `/resume/[id]`：简历编辑器主工作区。
- `/resume/[id]/export`：导出预览、版本选择器、导出方案保存。

### 4.2 编辑器布局

编辑器页面应保持稳定三段式结构：

- 顶部栏：简历名称、自动保存状态、导出按钮。
- 左侧栏：板块导航列表，支持排序、新增、删除。
- 中央区：当前板块内容、自然语言指令输入、AI diff 结果、版本历史。
- 底部或折叠区：JD 核心优势生成。

不要把导出版本选择器塞进主编辑器核心路径；导出前的组合选择属于 `/resume/[id]/export`。

## 5. 数据模型

### 5.1 Resume

```ts
interface Resume {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
  sectionOrder: string[]
}
```

约束：

- `sectionOrder` 是简历板块排序的唯一来源。
- 删除 section 时必须同步清理或修正 `sectionOrder`。
- 重排只更新 `sectionOrder`，不应改写 section 内容。

### 5.2 Section

```ts
interface Section {
  id: string
  resumeId: string
  type: SectionType
  title: string
  currentVersionId: string
}

type SectionType =
  | 'basic_info'
  | 'summary'
  | 'education'
  | 'work_experience'
  | 'project'
  | 'skills'
  | 'awards'
  | 'custom'
```

约束：

- Section 表示一个可排序、可复用、可多版本管理的简历板块。
- Section 自身不存正文内容，正文必须存在 SectionVersion。
- `currentVersionId` 指向当前激活版本。

### 5.3 SectionVersion

```ts
interface SectionVersion {
  id: string
  sectionId: string
  versionName: string
  content: SectionContent
  rawText: string
  createdAt: string
  createdBy: 'user' | 'ai'
}
```

约束：

- 每次接受 AI 修改应创建新版本，而不是覆盖旧版本。
- 手动保存具名版本也应创建新版本。
- 历史版本不可被隐式改写。
- MVP 倾向每个 section 最多保留 10 个版本；超过限制时应给出明确提示或受控清理策略。

### 5.4 SectionContent

```ts
type SectionContent =
  | BasicInfoContent
  | SummaryContent
  | EducationContent
  | WorkExperienceContent
  | ProjectContent
  | SkillsContent
  | CustomContent
```

关键结构：

```ts
interface BasicInfoContent {
  name: string
  email: string
  phone?: string
  location?: string
  linkedin?: string
  github?: string
  website?: string
}

interface SummaryContent {
  text: string
}

interface EducationContent {
  entries: {
    school: string
    degree: string
    major: string
    startDate: string
    endDate: string
    gpa?: string
    notes?: string[]
  }[]
}

interface WorkExperienceContent {
  entries: {
    company: string
    title: string
    startDate: string
    endDate: string
    location?: string
    bullets: string[]
  }[]
}

interface ProjectContent {
  entries: {
    name: string
    role?: string
    startDate?: string
    endDate?: string
    techStack?: string[]
    link?: string
    bullets: string[]
  }[]
}

interface SkillsContent {
  categories: {
    label: string
    items: string[]
  }[]
}

interface CustomContent {
  text: string
}
```

### 5.5 ExportScheme

```ts
interface ExportScheme {
  id: string
  resumeId: string
  name: string
  sectionVersionMap: Record<string, string>
  targetJobTitle?: string
  targetJD?: string
  advantageText?: string
  createdAt: string
}
```

约束：

- `sectionVersionMap` 的 key 是 section id，value 是 section version id。
- 导出时应按 Resume 的 `sectionOrder` 组装，而不是按 map 顺序。
- 保存方案后，再次导出应能复现当时选择的版本组合。

### 5.6 JDAnalysisResult

```ts
interface JDAnalysisResult {
  keyRequirements: string[]
  matchedStrengths: string[]
  advantageText: string
}
```

该结构为临时分析结果，默认不持久化。需要保存到导出方案时，仅保存最终 `advantageText`、目标岗位和 JD 原文。

## 6. 服务层约定

### 6.1 API 路由

#### `POST /api/parse`

职责：

- 接收 PDF 或 DOCX 上传结果中的文本内容。
- 调用 Claude 将简历文本解析为结构化 sections。
- 返回符合 SectionContent schema 的数据。
- 解析失败时返回可恢复错误，前端进入手动分段或手动填写流程。

不负责：

- 直接创建完整简历记录，除非调用方明确提交保存。
- 隐式修正用户简历内容。

#### `POST /api/edit`

职责：

- 接收 section type、当前 content、用户自然语言指令。
- 调用 Claude 返回修改后的完整 content JSON。
- 校验返回结构。
- 返回原始内容与建议内容，供前端 diff 和接受 / 拒绝。

不负责：

- 直接覆盖当前版本。
- 在用户未接受前创建新版本。

#### `POST /api/advantage`

职责：

- 接收目标岗位、JD 原文、当前简历摘要。
- 调用 Claude 生成 150-250 字核心优势文案。
- 可返回 key requirements 和 matched strengths 供 UI 展示。

不负责：

- 自动插入简历。
- 自动保存导出方案。

#### `POST /api/export`

职责：

- 接收 resume id 与 `sectionVersionMap`。
- 按 `sectionOrder` 拉取对应版本。
- 渲染固定 HTML 模板。
- 使用 Puppeteer 生成 PDF Buffer。
- 返回可下载 PDF，文件名格式为 `{resumeTitle}_{YYYYMMDD}.pdf`。

不负责：

- 修改简历内容。
- 改变当前激活版本。

### 6.2 Service 函数

建议服务层函数保持业务语义清晰：

- `listResumes(userId)`
- `createResume(input)`
- `getResumeWorkspace(resumeId)`
- `updateResumeTitle(resumeId, title)`
- `reorderSections(resumeId, sectionOrder)`
- `createSection(resumeId, input)`
- `deleteSection(sectionId)`
- `createSectionVersion(sectionId, input)`
- `setCurrentSectionVersion(sectionId, versionId)`
- `listSectionVersions(sectionId)`
- `createExportScheme(resumeId, input)`
- `getExportScheme(schemeId)`

服务层要求：

- 所有写操作必须校验当前用户是否拥有目标 resume。
- 所有跨表变更应尽量使用事务或 Supabase RPC，避免部分成功。
- 不在组件中直接拼数据库查询。
- 不在 API route 中重复写复杂业务规则，应下沉到 service。

## 7. AI 引用机制

### 7.1 AI 能力边界

AI 只负责三类任务：

- 简历解析：原始文本 -> 结构化 sections。
- 板块编辑：当前 section content + 用户指令 -> 新 section content。
- JD 优势生成：JD + 简历摘要 -> 核心优势文案。

AI 不应直接决定：

- 用户是否接受修改。
- 是否覆盖历史版本。
- 导出方案使用哪些版本。
- 是否删除用户内容。

### 7.2 Prompt 管理

- 所有 Prompt 模板集中放在 `lib/ai/prompts.ts`。
- Prompt 内必须明确要求输出格式。
- JSON 类结果必须要求「只输出 JSON，不要解释文字」。
- Prompt 修改属于行为变更，必须配套验证至少一个正向用例。

### 7.3 响应校验

AI 返回内容必须经过结构校验后才能进入业务流：

- 简历解析结果必须包含 `sections` 数组。
- 每个 section 必须有合法 `type`、`title` 和对应 `content`。
- 自然语言编辑返回的 schema 必须与当前 section type 匹配。
- 日期格式应统一为 `YYYY-MM` 或 `present`。
- 解析失败或校验失败时，前端应进入手动修复流程，不应静默吞掉错误。

### 7.4 AI 修改引用与可追溯性

- AI 修改被用户接受后，应创建 `createdBy: 'ai'` 的 SectionVersion。
- 新版本应保留 `rawText`，用于后续 JD 优势生成与导出摘要。
- UI 应能区分用户版本和 AI 版本。
- 拒绝 AI 修改不得产生版本记录。
- 撤销操作应回到上一个已保存版本，不应删除历史版本。

## 8. PDF 导出约定

模板规格：

- A4 页面。
- 页边距：上下 18mm，左右 20mm。
- 正文字号：10pt。
- 板块标题：12pt。
- 姓名：18pt。
- 行距：1.4。
- 颜色：纯黑白，不使用彩色装饰。
- 字体：中文优先思源黑体，英文优先 Inter。

导出逻辑：

1. 用户在 `/resume/[id]/export` 确认各板块版本。
2. 前端提交 `sectionVersionMap`。
3. 后端按 `sectionOrder` 组装 HTML。
4. Puppeteer 输出 PDF。
5. 前端触发下载。

禁止行为：

- 导出时修改当前简历内容。
- 导出时自动切换 `currentVersionId`。
- 导出模板依赖浏览器中的未保存编辑状态。
- PDF 输出与预览使用两套完全不同的结构。

## 9. 状态管理约定

### 9.1 Zustand EditorStore

```ts
interface EditorStore {
  resume: Resume | null
  sections: Section[]
  versions: Record<string, SectionVersion[]>
  activeSectionId: string | null
  isEditingInstruction: boolean
  pendingAIEdit: {
    original: SectionContent
    suggested: SectionContent
  } | null
  setActiveSection: (id: string) => void
  acceptAIEdit: () => void
  rejectAIEdit: () => void
  saveNewVersion: (sectionId: string, name: string) => void
  reorderSections: (newOrder: string[]) => void
}
```

约束：

- Store 管 UI 与编辑器交互状态，不替代数据库。
- `pendingAIEdit` 只表示尚未接受的 AI 建议。
- 接受 AI 建议后必须通过服务层创建新版本，并刷新版本列表。
- optimistic update 失败时必须回滚并提示。

### 9.2 服务端缓存

- 简历列表、板块列表、版本列表使用 SWR 或 React Query 缓存。
- 写操作完成后应 invalidate 相关 query。
- 不要让多个页面维护互相冲突的本地副本。

## 10. 开发约束

- 使用 TypeScript，新增业务对象必须有明确类型。
- 数据模型字段命名应与 PRD 保持一致，避免同义字段泛滥。
- 页面实现优先复用 `components/resume/*` 下的组件。
- 表单提交、AI 调用、导出操作必须有 loading、error、success 状态。
- 用户明确接受前，不落库 AI 建议。
- 不虚构简历中的数字、公司、学校、项目经历。
- 不将 API key 暴露到客户端。
- 不在客户端使用 Supabase service role key。
- 不为 MVP 引入简历模板市场、ATS 评分、求职进度追踪、多语言或实时协作。
- 自动保存只能保存用户明确编辑的当前内容，不应自动保存 pending AI 建议。
- 上传解析失败时必须保留用户可继续操作的路径。

## 11. 禁止破坏的逻辑

以下逻辑属于产品主干，后续实现 UI 或重构时不得破坏：

- 简历由多个 Section 组成，Section 由 SectionVersion 承载内容。
- `sectionOrder` 决定导出与编辑器展示顺序。
- `currentVersionId` 决定编辑器默认展示版本。
- AI 编辑必须先展示 diff，再由用户接受或拒绝。
- 接受 AI 编辑创建新版本，不覆盖旧版本。
- 拒绝 AI 编辑不产生数据写入。
- 导出组合允许每个板块选择不同版本。
- 导出组合不改变当前激活版本。
- PDF 预览与导出使用同一份组装数据。
- JD 核心优势生成只产生候选文案，不自动改写简历。
- 解析失败必须有手动兜底。
- API 超时最多自动重试 1 次，仍失败后交给用户处理。

## 12. 验收标准

### 12.1 P0 验收

- 用户可以上传 PDF 或 DOCX，并得到结构化板块。
- 用户可以从零新建简历并手动添加板块。
- 用户可以在编辑器中查看、编辑、增删、排序板块。
- 用户可以对单个板块输入自然语言指令并得到 AI 修改建议。
- 用户可以接受 AI 建议并保存为新版本。
- 用户可以拒绝 AI 建议且不产生版本写入。
- 用户可以使用固定模板导出 PDF。
- PDF 文件名包含简历标题和日期。
- PDF 内容顺序与 `sectionOrder` 一致。

### 12.2 P1 验收

- 每个板块可以保存多个具名版本。
- 用户可以切换任意历史版本为当前版。
- 用户可以查看版本列表，并区分用户版本和 AI 版本。
- 用户可以输入目标岗位和 JD，生成 150-250 字核心优势。
- 用户可以在导出前为每个板块选择具体版本。
- 用户可以保存并复用导出组合方案。

### 12.3 质量验收

- 关键业务路径无 TypeScript 类型错误。
- AI JSON 响应有结构校验和错误兜底。
- 所有写操作校验用户所有权。
- API key 和 service role key 只存在服务端环境。
- 主要操作有明确 loading 与错误反馈。
- 简历导出预览与 PDF 输出内容一致。
- 对旧版本的修改行为可追溯，不发生隐式覆盖。

## 13. 后续实现顺序建议

1. 建立基础类型、schema、Supabase 客户端和 service 层。
2. 实现 `/dashboard` 与 `/resume/new` 的最小可用流程。
3. 实现 `/resume/[id]` 编辑器骨架：顶部栏、左侧板块、中央内容。
4. 接入手动编辑与版本创建。
5. 接入 AI 编辑建议、diff、接受 / 拒绝。
6. 实现 `/resume/[id]/export` 版本选择器和 PDF 导出。
7. 接入 JD 核心优势生成与导出方案保存。

