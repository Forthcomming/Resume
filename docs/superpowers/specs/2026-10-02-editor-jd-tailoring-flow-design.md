# 编辑器 JD 定制流程设计

## 目标

将编辑器底部现有的 JD 问题检查面板改造为岗位定制入口。用户以当前简历为母版，在独立页面中输入 JD，查看“岗位重点—经历证据—推荐动作”，逐项确认版本切换与 Bullet 改写后，另存为一份新的岗位定制简历。

本阶段只提供编辑器入口，不新增 Dashboard 入口，也不保存 JD 分析历史。

## 用户问题

当前 JD-check 最多返回五条问题，再跳转到某个板块进行改写。它能够回答“哪里不好”，但不能回答用户真正需要完成的任务：

- 岗位最看重哪些能力；
- 自己有哪些真实经历能够证明这些能力；
- 当前选中的板块版本是否合适；
- 应该切换哪个已有版本；
- 哪些具体 Bullet 需要改写；
- 如何在不破坏母版的情况下产出可投递版本。

本设计把 JD 从检查工具升级为一次岗位定制任务的入口，但保留 Human-in-the-loop 原则：AI 生成可解释方案，用户逐项确认，系统最后另存新简历。

## 范围决策

已确认：

- 入口只放在当前简历编辑器底部。
- 点击入口后进入独立页面，而不是底部展开结果或使用大弹窗。
- 编辑器底部不再保留岗位名称和 JD 输入框。
- 当前简历自动作为母版，不要求用户再次选择。
- 用户先确认整套方案，再统一应用。
- 现有版本不匹配时，直接生成具体 Bullet 建议并展示 Diff。
- 应用后另存为新的简历变体，母版保持不变。
- 第一版只保存最终简历组合，不保存 JD、证据链和分析历史。

## 核心流程

```text
当前简历编辑器
  → 点击“开始定制”
  → 独立岗位定制页
  → 填写公司、岗位、JD
  → 生成适配方案
  → 查看岗位重点、经历证据和推荐动作
  → 逐项采纳或拒绝
  → 确认最终调整
  → 复制母版并应用动作
  → 打开新的岗位定制简历
  → 最终编辑、预览和导出 PDF
```

## 1. 编辑器入口

### 位置与职责

保留现有编辑器底部位置，但将 `JDPanel` 的复杂检查逻辑替换成轻量入口。入口只负责说明价值、展示当前母版和导航，不管理 JD、AI 请求或分析结果。

### 文案

左侧：

```text
按 JD 生成定制版
基于当前简历匹配岗位要求，生成新的投递版本
```

右侧按钮：

```text
开始定制
```

“生成适配方案”只用于独立页面中的提交按钮，因为进入页面前尚未提供 JD。

### 状态

- 正常：显示“开始定制”。
- 保存中：按钮禁用，显示“保存完成后开始”。
- 保存失败：不允许基于未同步内容开始，展示“重试保存”。
- 当前简历尚未完成水合：不渲染可操作入口。

点击后导航到：

```text
/resume/[id]/tailor
```

## 2. 独立岗位定制页

### 页面框架

页头：

```text
← 返回当前简历
岗位定制
基于「当前简历标题」生成新的岗位版本
```

进度：

```text
填写岗位信息 → 确认适配方案 → 生成定制简历
```

当前简历 ID 来自路由，服务端或本地加载现有 `ResumeContent` 和完整 `SectionSubVersionsStore`。JD 和简历内容不得放在 URL 查询参数中。

## 3. 阶段一：岗位信息

输入字段：

- 公司名称：选填，用于新简历标题。
- 岗位名称：必填。
- JD 全文：必填。

说明文案：

> 系统会分析岗位要求，并从当前简历的所有板块版本中寻找匹配证据。不会直接修改当前简历。

提交按钮：

```text
生成适配方案
```

### 输入校验

- 岗位名称为空：提示“请填写目标岗位名称”。
- JD 为空：提示“请先粘贴岗位 JD”。
- 去除空白后少于 80 个字符：提示 JD 信息不足，请补充岗位职责和任职要求，不调用 AI。
- 简历没有任何非空经历或简介/技能：提示先返回编辑器补充内容。
- 未配置 DeepSeek Key：保留页面输入，引导配置后返回继续。

第一版不持久化表单；刷新页面后允许丢失输入。

## 4. 适配方案结构

结果不再使用“问题列表”或抽象匹配分数，而是三段式证据结构。

### 4.1 岗位重点

提取 3～5 项要求。每项包含：

- 稳定 `requirementId`；
- 能力名称；
- 对应 JD 原文片段；
- `core` 或 `bonus` 重要程度；
- `covered`、`weak` 或 `missing` 覆盖状态。

用户文案：

- `covered`：已有充分证据；
- `weak`：有相关经历，表达可以加强；
- `missing`：暂未找到事实证据。

不显示百分比匹配分数。

### 4.2 经历证据

每项要求可以对应零到多条证据。证据来自当前简历所有板块子版本，而非仅当前活动组合。

每条证据必须携带：

- `requirementId`；
- `sectionId`；
- `versionId` 和版本名称；
- 可选 `entryIndex`、`bulletIndex`；
- 原始证据文本；
- 为什么能证明岗位要求；
- 该版本当前是否活动。

UI 必须同时展示“证据所在版本”和“当前使用版本”，让用户理解推荐切换的原因。

### 4.3 推荐动作

第一版只支持三种动作：

1. `keep`：保持当前活动版本。
2. `switch_version`：将某板块切换到另一个已有版本。
3. `rewrite_bullet`：在指定版本、经历和 Bullet 上展示原文与建议文本的 Diff。

用户可以取消任意 `switch_version` 或 `rewrite_bullet`。`keep` 只做解释，不计入调整数量。

如果不存在真实事实证据，只展示缺口，不生成内容，不提供采纳动作。

## 5. 全局版本组合

推荐不能按岗位要求孤立地产生，否则同一板块可能被推荐两个不同版本。服务端必须输出一套全局一致的目标组合：每个 `sectionId` 最多有一个目标活动 `versionId`。

决策优先级：

1. 当前版本已经充分覆盖时保持不变；
2. 优先复用覆盖更多核心要求的已有版本；
3. 已有版本相关但表达不足时，在最佳版本基础上改写具体 Bullet；
4. 没有事实证据时明确标记缺口；
5. 不编造公司、职位、项目、工具、职责或数据。

`switch_version` 动作必须与全局组合一致。多个岗位要求可以引用同一个切换动作，但 UI 只让用户确认一次。

## 6. Bullet Diff

`rewrite_bullet` 展示：

- 原文；
- 建议文本；
- 修改理由；
- 关联的岗位要求；
- “使用建议”“保留原文”“重新生成”。

重新生成只重试当前 Bullet，不重新运行完整 JD 分析。

约束：

- 只能改写已存在的 Bullet；
- 不新增原文没有的数字；
- 不修改其他 Bullet；
- 不修改公司、职位、项目名或日期；
- 返回结果必须仍是一条字符串 Bullet。

## 7. 最终确认与创建

底部固定操作栏展示：

```text
已选择 N 项调整
[返回修改 JD] [生成岗位定制版]
```

创建前展示摘要：

- 新简历默认名称；
- 版本切换数量；
- Bullet 改写数量；
- “母版不会被修改”。

默认名称：

- 公司和岗位均有值：`公司·岗位`；
- 只有岗位：`岗位·定制版`。

用户可以在创建前修改名称，但不能为空。

## 8. 应用规则

创建动作必须是“一次成功或不产生半成品”的事务性操作。

1. 深复制母版 `content` 与完整 `version_store`。
2. 生成新简历 ID 和标题。
3. 对用户采纳的 `switch_version` 设置目标板块活动版本。
4. 对每个有采纳改写的板块，复制其目标源版本，创建一个新版本。
5. 将采纳的 Bullet 建议应用到新版本。
6. 新版本命名为“岗位简称版”；重名时追加序号。
7. 将新版本设为活动版本。
8. 从最终活动版本重新组合 `content`。
9. 云端可用时一次写入新行；不可用时写入本地索引、内容和版本仓库。
10. 成功后导航到 `/resume/[newId]`。

原简历的本地缓存和云端记录均不得改变。

## 9. 内容一致性

分析请求必须携带由当前标题、内容和版本仓库计算的 `sourceFingerprint`。创建前重新计算母版指纹：

- 一致：允许创建。
- 不一致：拒绝应用，提示“当前简历在分析后发生了变化，请重新生成适配方案”。

服务端还需验证：

- 推荐的 `sectionId` 合法；
- `versionId` 在对应板块存在；
- Bullet 索引有效；
- Bullet 原文仍与方案中的 `original` 一致；
- 同一板块只有一个目标活动版本。

客户端不能把 AI 输出直接写入仓库而不经过上述验证。

## 10. AI 与接口边界

### 方案接口

新增：

```text
POST /api/resume/jd-plan
```

输入包含岗位信息、母版指纹和所有板块版本的紧凑表示。输出为结构化 `JdAdaptationPlan`。

分析分为两层职责：

- AI：提取岗位要求、匹配证据、提出全局版本组合和需要改写的目标。
- 代码：清洗 ID、验证引用、去重动作、限制数量、为非法结果提供安全回退。

### Bullet 重试接口

沿用现有 `/api/resume/edit` 和 Bullet `EditTarget`，只提交该 Bullet 与岗位要求，不新增重复的改写传输层。

### 创建动作

新增 Server Action：

```ts
createTailoredResumeAction(input): Promise<{
  ok: boolean;
  configured: boolean;
  resumeId?: string;
  error?: string;
}>;
```

云端与本地写入采用现有双模式；`configured: false` 时由客户端完成本地副本持久化。

现有 `/api/resume/jd-check` 和相关类型第一阶段保留，但 UI 不再调用，避免把删除旧接口混入主功能实现。

## 11. 建议类型

```ts
type JdCoverage = "covered" | "weak" | "missing";
type JdImportance = "core" | "bonus";

interface JdRequirement {
  id: string;
  title: string;
  jdQuote: string;
  importance: JdImportance;
  coverage: JdCoverage;
}

interface ResumeEvidence {
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

type JdRecommendationAction =
  | {
      id: string;
      type: "keep";
      sectionId: SectionId;
      versionId: string;
      reason: string;
    }
  | {
      id: string;
      type: "switch_version";
      sectionId: SectionId;
      fromVersionId: string;
      toVersionId: string;
      reason: string;
      requirementIds: string[];
    }
  | {
      id: string;
      type: "rewrite_bullet";
      sectionId: "work" | "project" | "education";
      versionId: string;
      entryIndex: number;
      bulletIndex: number;
      original: string;
      suggested: string;
      reason: string;
      requirementIds: string[];
    };

interface JdAdaptationPlan {
  sourceFingerprint: string;
  jobTitle: string;
  companyName: string;
  requirements: JdRequirement[];
  evidence: ResumeEvidence[];
  targetVersionBySection: Partial<Record<SectionId, string>>;
  actions: JdRecommendationAction[];
}
```

## 12. 组件边界

### 编辑器

- `JDTailorEntry`：轻量入口，接收简历 ID、标题、保存状态和重试动作。
- `ResumeEditor`：把现有 `JDPanel` 替换为入口，不承载岗位定制状态。

### 岗位定制页

- `TailorPageClient`：步骤状态、选择状态、请求协调和创建流程。
- `TailorJobForm`：岗位输入与前端校验。
- `TailorRequirementCard`：岗位重点、JD 引文和证据。
- `TailorActionCard`：版本切换或 Bullet Diff。
- `TailorPlanSummary`：目标组合与最终操作摘要。
- `TailorFooter`：固定操作区。

页面组件不直接构造或修改 `SectionSubVersionsStore`；组合复制与动作应用由 `lib/resume/tailoring.ts` 中的纯函数完成。

## 13. 错误与恢复

- AI 请求超时、连接失败、非 2xx、空响应或非法 JSON：保留岗位输入，展示可重试错误。
- 部分 AI 引用非法：丢弃非法证据或动作；如果不足以形成安全方案，则整次失败并要求重试。
- 单条 Bullet 重试失败：保留其他分析结果和用户选择。
- 创建云端副本失败：不跳转、不写半成品；允许重试。
- 本地写入 quota 失败：提示存储空间不足，不修改母版。
- 分析后母版变化：阻止创建并要求重新分析。
- 用户返回编辑器：不创建数据，不保存 JD。

## 14. MVP 范围

### 本次实现

- 编辑器底部轻量入口。
- 独立 `/resume/[id]/tailor` 页面。
- 岗位表单及校验。
- 3～5 项岗位重点与 JD 原文。
- 全版本经历证据匹配。
- 全局一致的版本组合。
- `keep`、`switch_version`、`rewrite_bullet`。
- Bullet Diff 的采纳、保留和单条重试。
- 用户确认后复制母版并应用动作。
- 云端与本地模式均可创建新简历。
- 成功后进入现有编辑器与 PDF 闭环。

### 本次不做

- Dashboard 入口。
- JD、证据链或分析历史持久化。
- 投递方案列表。
- 百分比匹配分数。
- 多 JD 对比或批量生成。
- 求职信和自动投递。
- 删除旧 `/api/resume/jd-check`。
- 新的数据库表或 schema 迁移。

## 15. 测试与验收

### 纯函数测试

- 指纹对相同数据稳定、内容变化后不同。
- 全局版本组合只能为每板块选择一个版本。
- 非法版本 ID、索引或原文不匹配被拒绝。
- 创建副本不修改输入母版。
- 采纳切换后活动版本正确。
- 同一板块多个改写合并进一个新子版本。
- 未采纳动作不影响输出。
- 本地副本获得新 ID、标题、时间和独立存储内容。

### AI 清洗测试

- 要求最多 5 项且 ID 稳定。
- JD 引文、证据和动作引用必须可解析。
- 非法 `sectionId`、`versionId` 和 Bullet 索引被丢弃。
- `missing` 要求不得拥有改写动作。
- 同板块冲突切换被拒绝或归一为目标组合。

### 页面验收

1. 编辑器底部只显示岗位定制入口，不再显示 JD 输入或问题列表。
2. 点击入口进入当前简历的独立岗位定制页。
3. 当前简历标题正确显示，返回链接有效。
4. 岗位名称和 JD 校验生效。
5. 结果展示岗位重点、JD 原文、真实经历证据和推荐动作。
6. 用户可以取消版本切换和 Bullet 改写。
7. 重新生成 Bullet 不清空其他结果。
8. 新简历标题可修改且母版不会变化。
9. 云端与本地模式均能创建新简历并跳转。
10. 母版发生变化时阻止应用旧方案。
11. 新简历可继续编辑、自动保存、预览并导出 PDF。

## 16. 成功指标

真实用户验证阶段记录：

- 进入定制页到生成方案的完成率；
- 至少采纳一项动作的比例；
- 已有版本切换建议采纳率；
- Bullet 建议采纳率；
- 从输入 JD 到创建新简历的中位耗时；
- 新定制简历的 PDF 导出率；
- 用户报告的事实错误次数。

第一轮目标是假设验证，不作为对外承诺：5～10 名秋招用户，每人完成 2～3 个岗位适配任务，观察是否能在 5 分钟内生成第一份可继续编辑的定制简历。
