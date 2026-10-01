# ResumeKit 工程收口设计

## 目标

在不扩展产品功能、不改变现有用户工作流的前提下，完成固定校招预览 WIP 收口，建立最小测试安全网，消除 DeepSeek 调用重复，拆分过大的编辑器编排组件，并解决 Supabase Edge Runtime 构建警告。

完成后，现有主闭环保持不变：简历导入、板块编辑、子版本管理、AI 改写与 Diff、JD 检查、自动保存、A4 预览和 PDF 导出继续使用原路由、数据结构和存储 Key。

## 提交与执行顺序

按以下顺序形成独立、可审查、可回滚的提交：

1. 固定校招预览验收与收口。
2. 测试框架与简历核心纯函数测试。
3. 统一 DeepSeek JSON 调用层。
4. `ResumeEditor` 编排逻辑拆分。
5. Supabase Edge Runtime 警告修复。
6. 经用户最终确认后的临时产物清理。

每一步完成后运行与风险相称的验证；验证失败时先修复当前提交，不继续叠加下一项。

## 1. 固定校招预览

### 现役行为

- 纸面固定为 A4，长内容按固定高度展示多页预览。
- 姓名居中，头像位于右上角，主联系行仅显示手机与邮箱。
- 工作、项目、教育采用左/中/右三栏信息行。
- 板块标题使用中文标题与通栏底线。
- 默认日期格式为 `YYYY.MM`。
- 不再提供紧凑、标准、宽松三档密度切换。

### 兼容策略

- `SectionSubVersionsStore.density` 保留为废弃兼容字段，旧数据可以读入，但不再参与清洗结果、状态更新或预览渲染。
- 不修改现有数据库 schema、本地存储 Key 或旧版本迁移入口。
- `docs/ARCHITECTURE.md` 与单一校招预览规格作为当前实现说明；历史密度规格保留为历史设计记录，不再作为现役合同。

### 验收场景

- 空白简历仍显示稳定纸面和占位状态。
- 示例简历的页眉、三栏经历、板块标题和日期格式正确。
- 长内容生成多页，右栏可滚动，内容不横向溢出。
- 有头像和无头像时姓名都保持视觉居中。
- PDF 页尺寸、顺序和可见预览一致。

## 2. 最小测试安全网

引入 Vitest，新增命令：

```text
npm test
npm run test:watch
```

测试仅覆盖这轮重构直接依赖的稳定逻辑，不引入 React Testing Library 或浏览器测试框架。

### `reorderList`

- 向前和向后移动正确。
- 同位置、负索引和越界索引返回原数组引用。
- 正常移动返回新数组且不修改输入。

### 版本仓库

- 平铺内容初始化为每板块一个默认版本。
- 活动版本可正确组合为 `ResumeContent`。
- 旧整份快照可迁移为板块子版本。
- 非法或不完整的板块顺序会被清洗为完整、无重复顺序。
- 旧 `density` 值不会影响解析结果或预览偏好。
- 新建、复制、切换、重命名和删除版本不影响其他板块；每个板块至少保留一个版本。

### DeepSeek JSON 客户端

- 正常 JSON 与 Markdown 代码围栏 JSON 均能解析。
- 非 2xx、空响应、非法 JSON 和超时分别转换为现有 `AIError` 语义。
- 测试使用 mock `fetch`，不发出真实 DeepSeek 请求。

## 3. 统一 DeepSeek JSON 调用层

新增内部泛型接口：

```ts
requestDeepseekJson<T>({
  apiKey,
  systemPrompt,
  userPrompt,
  temperature,
  timeoutMs,
  errors,
}): Promise<T>
```

公共职责：

- 用户 BYOK 优先、服务端 `DEEPSEEK_API_KEY` 回退。
- 读取 `DEEPSEEK_API_URL` 与 `DEEPSEEK_MODEL`。
- 构造 Chat Completions 请求和 `response_format: json_object`。
- 默认 60 秒超时并清理 timer。
- 处理连接失败、Abort、非 2xx、空 choices、代码围栏与 JSON 解析失败。
- 保留当前 HTTP 状态码和面向用户的错误文案。

业务模块继续独立负责：

- 简历解析、板块改写和 JD 检查各自的 system/user prompt。
- `ResumeContent` 正规化。
- `sectionId`、severity、issues 数量等业务字段校验和回退。

API 路径 `/api/resume/parse`、`/api/resume/edit`、`/api/resume/jd-check` 及客户端请求格式不变。

## 4. `ResumeEditor` 拆分

### `useResumePersistence`

负责工作区水合与持久化：

- 根据服务端时间与本地更新时间选择初始版本仓库。
- 将只有平铺内容的旧数据补齐为版本仓库。
- 维护 `store`、标题和保存状态。
- 800ms 防抖自动保存、手动重试和本地草稿回退。
- 标题同时更新本地索引和 Server Action。

输出当前 `store`、`setStore`、`resumeTitle`、`saveState`、`retrySave` 和标题修改动作。

### `useResumeVersions`

负责纯本地版本编排：

- 组合当前活动版本内容。
- 提供板块顺序、日期格式、板块显示标题和当前板块内容。
- 提供创建、复制、重命名、删除、切换版本，以及板块移动、标题修改、日期格式修改动作。
- 不访问网络或 localStorage。

### `useResumeAIEdit`

负责 AI 编辑交互状态：

- 管理板块 AI、Bullet AI、pending edit 和 Modal 元数据。
- 构造 `EditTarget`，发起请求并映射 loading/ready/error 状态。
- 接受建议时只更新当前活动版本；拒绝或关闭时清理临时状态。
- 保持当前 Diff、快捷指令和错误体验。

`ResumeEditor` 保留页面布局、各 hook 的组合、PDF 导出和组件 props 连接，不新增全局状态库。

## 5. Supabase Edge Runtime 警告

### 根因

当前锁定的 `@supabase/supabase-js@2.108.2` 在 Edge bundle 中包含静态 `process.version` 访问。Next.js middleware 静态分析因此发出警告；应用构建仍成功。Supabase 已在 `2.110.5` 通过动态 `globalThis` 访问修复该警告。

### 处理

- 将 `@supabase/supabase-js` 的声明下限更新为 `^2.110.5`，由 lockfile 锁定安装时解析到的兼容版本。
- 暂不升级 `@supabase/ssr@0.5.2`，避免把 SSR API 迁移混入本轮收口。
- 保持官方 cookie-based `createServerClient` middleware 模式不变。
- 重新运行生产构建，验收标准是警告消失且匿名会话、cookie 刷新与首页重定向行为不变。

## 6. 工作区清理边界

删除候选：

- `.tmp-docx-template/`
- `.tmp-docx-template.zip`
- `.superpowers/` 中本次 brainstorming 伴侣产生的会话文件

保留且不纳入本轮修改：

- `output/` 中的品牌图与海报资源
- `.agents/` 下的项目技能
- `skills-lock.json`
- 与本轮无关的用户未提交文件

先通过 `.gitignore` 防止明确的临时会话和解包目录再次污染状态。实际删除在代码、测试、构建和文档验证完成后列出最终清单；依照项目收尾规则，只有用户查看清单并再次明确确认后才执行，并以独立提交记录。

## 错误处理与回归约束

- 云端未配置或保存失败时仍回退本地草稿，不丢失编辑内容。
- 本地缓存损坏时继续使用服务端或正规化后的空内容。
- AI 请求失败不修改当前版本；接受动作只在建议状态为 ready 时生效。
- 旧版本仓库、旧日期格式和旧 `density` 字段均可安全读取。
- 不改变删除版本的最少一个版本约束。
- 不新增用户可见功能，不改变 Dashboard、编辑器和设置页的信息架构。

## 完成标准

- 固定校招预览通过五类人工场景验收。
- `npm test`、`npm run lint`、`npm run build` 全部通过。
- 生产构建不再出现 Supabase `process.version` Edge Runtime 警告。
- 三个 AI 功能的成功、超时、无 Key、非 2xx 和非法 JSON 行为保持一致。
- 自动保存、本地回退、刷新恢复和旧版本迁移通过回归验证。
- `ResumeEditor` 不再直接承载保存、版本和 AI 状态机实现。
- 架构文档与代码一致，清理候选在用户确认前保持可恢复现场。
