# PRD — 模块化简历优化工具 (ResumeKit)

> **版本**: v1.0  
> **定位**: 个人作品集项目 / 自用工具  
> **技术栈**: Next.js 14 + TypeScript + Supabase + Claude API + Puppeteer  
> **目标**: 把简历从「一个文件」变成「模块库 + 动态组装引擎」

---

## 1. 产品目标

### 1.1 核心问题
求职者同时投递多个岗位时，需要针对不同 JD 维护多份简历变体。现有方案（Word 手改 / ChatGPT 对话 / 模板网站）均不支持模块化版本管理，导致：
- 版本混乱（`简历_最终版_v3_真的最终版.docx`）
- 每次定制从头操作，重复劳动高
- AI 改写无持久化状态，无法复用

### 1.2 解决方案
将简历结构化为独立「板块」，每个板块可保存多个版本，投递时按目标岗位自由组合板块与版本，一键导出 PDF。

### 1.3 成功指标（作品集视角）
- [ ] 完整跑通「上传 → 解析 → 编辑 → 多版本保存 → 组合导出」闭环
- [ ] 自然语言编辑指令响应准确率 ≥ 85%
- [ ] PDF 导出格式与预览一致

---

## 2. 用户场景

### 主场景：针对不同 JD 定制简历

```
用户行为流:
1. 上传现有简历 PDF/Word
2. 系统解析为结构化板块（基本信息、教育、工作经历 × N、项目经历 × N、技能）
3. 针对某块内容自然语言编辑（「把这段工作经历改得更有数据感」）
4. 将修改后的版本保存为该板块的新版本（如「工作经历_产品侧版」）
5. 输入目标 JD，AI 生成「核心优势」文案
6. 选择各板块的目标版本，预览并导出 PDF
```

### 次场景：从零创建简历
```
用户行为流:
1. 选择「新建简历」
2. 逐板块填写或粘贴内容
3. 后续流程同主场景 3–6
```

---

## 3. 功能范围

### 3.1 P0 — MVP 核心闭环

#### F01 简历上传与解析
- 支持格式：PDF、DOCX
- 调用 Claude API 将原始文本解析为结构化 JSON
- 解析失败时提供手动分段兜底

#### F02 板块展示与管理
- 板块类型枚举（见数据模型 §5）
- 支持拖拽调整板块顺序
- 支持手动新增 / 删除板块

#### F03 自然语言编辑
- 用户在板块内输入自然语言指令
- 调用 Claude API 返回修改后内容
- 支持接受 / 拒绝 / 撤销

#### F04 PDF 导出
- 使用固定模板（1 套，干净单栏）
- Puppeteer 渲染 HTML → PDF
- 文件名自动带时间戳

### 3.2 P1 — 核心差异化

#### F05 板块多版本管理
- 每个板块可保存多个具名版本（如「数据侧」「产品侧」）
- 版本列表展示，支持版本对比
- 支持将任意历史版本设为「当前版」

#### F06 JD 定向核心优势生成
- 用户输入目标岗位名称 + JD 全文
- Claude 分析 JD 要求，结合当前简历内容
- 生成「核心优势」段落（150–250 字），可直接插入简历头部
- 可针对同一简历生成多个岗位版本的优势文案并分别保存

#### F07 组合导出
- 导出前展示「版本选择器」：每个板块选择使用哪个版本
- 支持保存「组合方案」（如「字节产品岗方案」）
- 导出 PDF

### 3.3 不在范围内（明确不做）

| 功能 | 原因 |
|------|------|
| 简历模板美化系统 | 时间黑洞，1套够用 |
| ATS 关键词评分 | 可后期接入，非核心差异 |
| 求职进度追踪 | 超出产品边界 |
| 手机端适配 | 桌面端优先 |
| 多语言简历 | 后期扩展 |
| 实时协作 | 单用户场景 |
| B 端 HR 工具 | 超出作品集定位 |

---

## 4. 页面结构

```
/                          # Landing / 登录
/dashboard                 # 简历列表（所有简历卡片）
/resume/new                # 新建简历（上传或从零创建）
/resume/[id]               # 简历编辑器（主工作区）
/resume/[id]/export        # 导出预览 + 版本选择器
```

### 4.1 简历编辑器（主工作区）布局

```
┌─────────────────────────────────────────────────────┐
│  顶部栏: 简历名称 | 自动保存状态 | [导出] 按钮        │
├───────────────┬─────────────────────────────────────┤
│  左侧栏       │  中央编辑区                          │
│  板块导航列表  │  当前选中板块内容                    │
│  （可拖拽排序）│  + 自然语言指令输入框               │
│               │  + 版本历史侧边栏（可展开）           │
│               ├─────────────────────────────────────┤
│               │  底部: JD 核心优势生成区（可折叠）    │
└───────────────┴─────────────────────────────────────┘
```

---

## 5. 数据模型

```typescript
// 简历主体
interface Resume {
  id: string                    // uuid
  userId: string
  title: string                 // 用户自定义名称，如「字节投递版」
  createdAt: string             // ISO 8601
  updatedAt: string
  sectionOrder: string[]        // section id 数组，决定顺序
}

// 板块
interface Section {
  id: string                    // uuid
  resumeId: string
  type: SectionType
  title: string                 // 用户可自定义，如「工作经历」
  currentVersionId: string      // 当前激活版本
}

type SectionType =
  | 'basic_info'        // 姓名、联系方式、个人主页
  | 'summary'           // 个人简介 / 核心优势
  | 'education'         // 教育经历
  | 'work_experience'   // 工作经历
  | 'project'           // 项目经历
  | 'skills'            // 技能
  | 'awards'            // 获奖 / 证书
  | 'custom'            // 自定义板块

// 板块版本
interface SectionVersion {
  id: string                    // uuid
  sectionId: string
  versionName: string           // 如「产品侧」「数据侧」「默认」
  content: SectionContent       // 结构化内容（见下）
  rawText: string               // 纯文本备份，供 AI 处理
  createdAt: string
  createdBy: 'user' | 'ai'
}

// 板块内容（各类型结构）
type SectionContent =
  | BasicInfoContent
  | SummaryContent
  | EducationContent
  | WorkExperienceContent
  | ProjectContent
  | SkillsContent
  | CustomContent

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
  text: string                  // 富文本或 Markdown
}

interface EducationContent {
  entries: {
    school: string
    degree: string
    major: string
    startDate: string           // YYYY-MM
    endDate: string             // YYYY-MM 或 'present'
    gpa?: string
    notes?: string[]            // 荣誉、课程等
  }[]
}

interface WorkExperienceContent {
  entries: {
    company: string
    title: string
    startDate: string
    endDate: string
    location?: string
    bullets: string[]           // 每条成就/职责描述
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
    label: string               // 如「编程语言」「工具」
    items: string[]
  }[]
}

interface CustomContent {
  text: string
}

// 导出组合方案
interface ExportScheme {
  id: string
  resumeId: string
  name: string                  // 如「字节产品岗方案」
  sectionVersionMap: Record<string, string>  // { sectionId: versionId }
  targetJobTitle?: string
  targetJD?: string
  advantageText?: string        // AI 生成的核心优势文案
  createdAt: string
}

// JD 分析结果（临时，不持久化）
interface JDAnalysisResult {
  keyRequirements: string[]     // 从 JD 提取的核心要求
  matchedStrengths: string[]    // 与用户简历匹配的优势点
  advantageText: string         // 生成的核心优势段落
}
```

---

## 6. AI 接口设计

### 6.1 简历解析

**触发时机**: 用户上传文件后

**模型**: `claude-sonnet-4-6`（解析准确性优先）

**Prompt 模板**:
```
你是一个专业的简历解析器。请将以下简历文本解析为结构化 JSON。

要求：
- 严格按照 schema 输出，不要添加任何解释文字
- 如果某字段无法确定，设为 null
- bullets 数组中每条保持原文，不要合并或拆分
- 日期格式统一为 YYYY-MM，「至今」统一为 "present"

输出 schema：
{
  "sections": [
    {
      "type": "basic_info" | "summary" | "education" | "work_experience" | "project" | "skills" | "awards" | "custom",
      "title": "板块标题（原文）",
      "content": { ... }  // 对应 SectionContent 结构
    }
  ]
}

简历原文：
{{RESUME_TEXT}}
```

**错误处理**:
- 解析结果缺失关键字段 → 弹出手动补全表单
- API 超时 → 重试 1 次，仍失败则提示用户手动输入

---

### 6.2 自然语言编辑

**触发时机**: 用户在板块内输入指令并提交

**模型**: `claude-sonnet-4-6`

**Prompt 模板**:
```
你是一个专业的简历写作助手。请根据用户指令修改以下简历板块内容。

规则：
- 只修改用户要求修改的部分，不要改动其他内容
- 保持原有结构（JSON schema 不变）
- 量化描述时，如果原文没有数字，不要凭空捏造数字
- 严格输出 JSON，不要包含解释文字

当前板块类型: {{SECTION_TYPE}}
当前板块内容（JSON）:
{{CURRENT_CONTENT}}

用户指令: {{USER_INSTRUCTION}}

输出修改后的完整板块内容 JSON：
```

**响应处理**:
- 解析返回 JSON，与原内容做 diff 展示给用户
- 用户点击「接受」→ 保存为新版本（`createdBy: 'ai'`）
- 用户点击「拒绝」→ 不做任何修改

---

### 6.3 JD 核心优势生成

**触发时机**: 用户输入 JD 后点击「生成核心优势」

**模型**: `claude-sonnet-4-6`

**Prompt 模板**:
```
你是一个资深猎头顾问，擅长提炼候选人核心竞争力。

任务：根据目标岗位 JD 和候选人简历，生成一段「核心优势」文案，用于简历头部。

要求：
- 150–250 字
- 聚焦 JD 的 3–4 个核心要求，逐一呼应
- 用第一人称，专业但不浮夸
- 有具体案例或数据支撑（从简历中提取，不虚构）
- 直接输出文案，不要标题、不要解释

目标岗位：{{JOB_TITLE}}

JD 原文：
{{JD_TEXT}}

候选人简历摘要（当前所有板块的 rawText 拼接）：
{{RESUME_SUMMARY}}

输出核心优势文案：
```

---

## 7. PDF 导出方案

### 技术选型
- **方案**: Puppeteer 渲染 HTML → PDF
- **模板引擎**: React Server Component 生成 HTML，内联 CSS
- **字体**: 思源黑体（中文）+ Inter（英文），预加载

### 模板规格（单栏简洁版）
```
页面尺寸: A4（210 × 297mm）
页边距: 上下 18mm，左右 20mm
正文字号: 10pt
标题字号: 板块标题 12pt，姓名 18pt
行距: 1.4
颜色: 纯黑白，无彩色装饰
```

### 导出流程
```
1. 用户在「版本选择器」确认各板块版本
2. 前端调用 /api/export，传入 sectionVersionMap
3. 后端按 sectionOrder 顺序拼装 HTML
4. Puppeteer 渲染并返回 PDF Buffer
5. 前端触发下载，文件名: {resumeTitle}_{YYYYMMDD}.pdf
```

---

## 8. 技术架构

```
Frontend (Next.js 14 App Router)
├── /app
│   ├── (auth)/              # 登录页
│   ├── dashboard/           # 简历列表
│   ├── resume/
│   │   ├── new/             # 新建流程
│   │   ├── [id]/            # 编辑器
│   │   └── [id]/export/     # 导出预览
│   └── api/
│       ├── parse/           # 简历解析 → Claude
│       ├── edit/            # 自然语言编辑 → Claude
│       ├── advantage/       # JD 优势生成 → Claude
│       └── export/          # PDF 导出 → Puppeteer

Backend (Supabase)
├── Database (PostgreSQL)
│   ├── resumes
│   ├── sections
│   ├── section_versions
│   └── export_schemes
├── Auth (Supabase Auth)     # 邮箱登录
└── Storage                  # 上传的原始文件（可选）

External APIs
├── Anthropic Claude API     # 解析 / 编辑 / 生成
└── Puppeteer (自部署)       # PDF 渲染
```

---

## 9. 状态管理

### 客户端状态（Zustand）
```typescript
interface EditorStore {
  // 当前编辑的简历
  resume: Resume | null
  sections: Section[]
  versions: Record<string, SectionVersion[]>  // { sectionId: versions[] }

  // UI 状态
  activeSectionId: string | null
  isEditingInstruction: boolean
  pendingAIEdit: { original: SectionContent; suggested: SectionContent } | null

  // Actions
  setActiveSection: (id: string) => void
  acceptAIEdit: () => void
  rejectAIEdit: () => void
  saveNewVersion: (sectionId: string, name: string) => void
  reorderSections: (newOrder: string[]) => void
}
```

### 服务端状态（SWR / React Query）
- 简历列表、板块列表、版本列表均通过 SWR 缓存
- 编辑操作 optimistic update，失败时回滚

---

## 10. 开发阶段划分

### Phase 1（P0）— 约 2–3 周
- [ ] Supabase 项目初始化 + 表结构创建
- [ ] 文件上传 + Claude 解析 API
- [ ] 编辑器主布局（板块列表 + 内容区）
- [ ] 板块内容展示与手动编辑
- [ ] 自然语言编辑指令（接受/拒绝）
- [ ] Puppeteer PDF 导出（固定模板）

### Phase 2（P1）— 约 1–2 周
- [ ] 板块多版本保存与切换
- [ ] 版本对比 UI
- [ ] JD 输入 + 核心优势生成
- [ ] 导出版本选择器
- [ ] 导出方案保存

### Phase 3（收尾）— 约 1 周
- [ ] 错误处理完善（解析失败兜底、API 超时重试）
- [ ] 自动保存
- [ ] 基础响应式（宽屏优先）
- [ ] README + 作品集 Case Study 文档

---

## 11. 环境变量

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 12. 待决策项（开发前确认）

| # | 问题 | 当前倾向 | 需要确认 |
|---|------|----------|----------|
| 1 | 用户认证是否必须？ | 先做，用 Supabase Auth 邮箱登录 | 作品集演示可能需要 guest 模式 |
| 2 | 文件原始内容是否持久化存储？ | 只存解析后 JSON，不存原文件 | 节省存储成本 |
| 3 | 自然语言编辑是否流式输出？ | 否，等待完整结果再展示 diff | 流式实现复杂度更高 |
| 4 | 版本数量是否有上限？ | 每个板块最多 10 个版本 | 防止数据库膨胀 |
| 5 | PDF 模板数量？ | MVP 1 套，后续可扩展 | 确认样式是否可接受 |
