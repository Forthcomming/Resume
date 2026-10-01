# ARCHITECTURE — ResumeKit

> 现行实现说明（以代码为准）。早期 PRD / 选型若与本文冲突，以本文与仓库现状为准。

## 1. 产品定位

模块化简历优化工具：结构化板块编辑、板块子版本、JD 定向检查、AI 改写、浏览器端 PDF 导出。

主闭环：

1. 落地页新建 / 上传简历（解析为结构化 JSON）。
2. Dashboard 管理简历列表（重命名、删除）。
3. 编辑器按板块编辑，支持自然语言改写与 diff 接受。
4. 板块多子版本本地/云端同步。
5. 粘贴目标 JD，检查匹配问题并一键跳转改写。
6. 预览并导出 PDF。

## 2. 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js 14 App Router · React 18 · TypeScript · Tailwind |
| Auth | Supabase **匿名登录** + SSR cookie（`middleware`） |
| 数据 | Postgres 表 `resumes` + RLS；可关云端回落 localStorage |
| AI | DeepSeek Chat Completions；用户 BYOK（`x-deepseek-api-key`），可回落 `DEEPSEEK_API_KEY` |
| 文件解析 | `mammoth`（DOCX）· `unpdf`（PDF）→ 文本再结构化 |
| PDF | 浏览器 `html2canvas` + `jspdf`（非服务端 Puppeteer） |
| 状态 | React 本地 state + Supabase / localStorage（无 Zustand / SWR） |

## 3. 目录

```text
app/
  page.tsx                 # Landing
  dashboard/page.tsx
  settings/page.tsx        # DeepSeek Key
  resume/[id]/page.tsx     # 编辑器
  api/resume/
    parse/route.ts
    edit/route.ts
    jd-check/route.ts
components/
  landing/ dashboard/ layout/ settings/ auth/
  resume/editor/           # 编辑器 UI；hooks/ 分离保存、版本与 AI 状态机
lib/
  ai/                      # DeepSeek 统一 JSON 调用层、client 薄封装、BYOK
  resume/                  # content、versions、export-pdf
  supabase/ auth/ storage/
services/
  resumes.ts
  resume-content.ts
types/
  resume.ts · ai-edit.ts · jd-check.ts
supabase/schema.sql
docs/                      # PRD、设计系统、本架构
```

约定：

- `app/` 路由与 API 入口；业务逻辑落在 `lib/` / `services/`。
- `components/` 不直接用服务端 Admin Key。
- Agent 约定见根目录 `AGENTS.md`。

## 4. 页面与布局

| 路由 | 职责 |
|---|---|
| `/` | Landing + 新建/上传入口 |
| `/dashboard` | 简历卡片列表 |
| `/resume/[id]` | 编辑器 |
| `/settings` | API Key |

编辑器结构：

- 顶栏：标题、保存状态、导出
- 主区：板块表单 + 预览
- AI：行内指令 / Modal + Diff（`AIInlinePrompt`、`AIModal`、`AIDiffView`）
- 底栏：`JDPanel` 定向检查

无独立 `/resume/new`、`/resume/[id]/export`、邮箱登录页。

## 5. 数据模型

### 5.1 表 `resumes`

字段要点：`id`、`user_id`、`title`、`section_order`、`tags`、`content`（jsonb）、`version_store`（jsonb）、时间戳。RLS 按 `user_id` 隔离。

### 5.2 内容板块（现役）

`basic_info` · `summary` · `work` · `education` · `project` · `skills`

（`types/resume.ts` 里若仍有 `awards` / `custom`，属 PRD 残留，编辑器未实现。）

### 5.3 板块子版本

`SectionSubVersionsStore`（见 `lib/resume/versions.ts`）：

- 每板块：`activeVersionId` + `versions[]`
- 另含 `sectionOrder`、`sectionTitles`、日期格式等编辑偏好（预览为固定校招版式，无密度三档）
- `content` 为当前激活版本合成快照；旧整份 snapshot 仅迁移用

## 6. API

| 方法 | 路径 | 作用 |
|---|---|---|
| POST | `/api/resume/parse` | 上传文件 → 抽文本 → DeepSeek 结构化 → 创建简历 |
| POST | `/api/resume/edit` | 按 `EditTarget`（section / field / bullet）改写 |
| POST | `/api/resume/jd-check` | 对照 JD 返回最多 5 条问题（含可执行 `instruction`） |

请求可带用户 DeepSeek Key 头；无独立 `/api/export`、`/api/advantage`。

## 7. AI 与 BYOK

- **Parse / Edit / JD-check**：均通过 `deepseek-client.ts` 处理鉴权、超时、HTTP 与 JSON；各功能提示词和业务校验保留在独立模块。
- **客户端**：`client-edit.ts`、`client-jd-check.ts`；Key 存 localStorage（设置页 / 门禁可 skip）。
- **JD-check**：输出问题列表并支持「去优化」跳转改写，不是单独的「核心优势文案」API。

## 8. 导出

预览 DOM → `lib/resume/export-pdf.ts`（html2canvas + jsPDF）。模板为编辑器内单栏预览，无服务端渲染队列。

## 9. 测试与构建

- `npm test`：Vitest，覆盖排序、板块版本迁移/组合/操作和 DeepSeek JSON 调用层。
- `npm run lint`：Next.js ESLint。
- `npm run build`：生产构建；`@supabase/supabase-js` 最低版本为 `2.110.5`，避免 middleware Edge Runtime 的静态 `process.version` 警告。

## 10. 明确不做 / 已废弃选型

以下出现在旧文档或 PRD 中，**当前仓库未使用**：

- Zustand、SWR / React Query
- Anthropic Claude、Puppeteer 服务端 PDF
- 邮箱密码登录、独立 `store/`、`lib/export/`
- `POST /api/advantage`、`POST /api/export`
- 多表 sections / section_versions / export_schemes（现为单表 jsonb）

## 11. 相关文档

- 产品原稿：`docs/resume-optimizer-prd.md`（历史需求，实现以本文为准）
- 设计系统：`docs/resumekit-design-system-vyra.md`
- Agent：`AGENTS.md` · 根 `README.md`
