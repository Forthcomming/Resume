# 工作/项目条目总结句设计

## 目标

让工作经历与项目经历每条可选支持一句「总结句」：预览/PDF 首行无圆点、加粗；解析可识别；编辑器可改；并提供与 bullet 同款的单行 AI 优化。

## 范围

### 做

- `WorkEntry` / `ProjectEntry` 增加可选 `summary`
- 解析输出 `summary`；旧数据导入时启发式提升首条 bullet（宁可漏提）
- 预览与 PDF：非空 `summary` 无圆点、加粗，位于 bullets 上方
- 编辑器：总结句输入框 + 旁侧 AI 按钮
- 版本 variant、AI 改写切片、JD 相关透传包含 `summary`
- 最小单测覆盖归一化、预览结构、版本 round-trip、summary AI 切片

### 不做

- 教育/技能等其他板块
- 改版式模板体系
- 自动「一键生成全部总结句」批处理

## 数据模型

```ts
interface WorkEntry {
  // ...existing fields
  summary?: string; // 可空；缺省视为 ""
  bullets: string[]; // 不含总结句
}

interface ProjectEntry {
  // ...existing fields
  summary?: string;
  bullets: string[];
}
```

- 空条目：`summary: ""`
- 兼容旧 JSON：缺字段按 `""` 处理
- 版本拆分：`summary` 与 `title`/`role`/`bullets`/`techStack` 同属 **variant**（可随岗位版本变化）；facts 不变

## 解析与旧数据迁移

1. 解析提示词：工作/项目每条可输出 `summary`（一句总述，可空）+ `bullets`（不得重复放入该句）。
2. 导入归一化：
   - 已有非空 `summary` → 保留，不从 bullets 再提。
   - 无 `summary` 且 `bullets[0]` 经启发式判定像总结句 → 提升为 `summary`，并从 `bullets` 移除该项。
   - 拿不准 → 不提升，整条仍留在 `bullets`（宁可漏提、不误提）。
3. 启发式原则：偏概括、不像具体职责罗列；不依赖强规则堆叠，保持可测的少量条件即可。

## 预览 / PDF / 编辑器

- 预览与 PDF 共用 DOM：`summary` 非空时在 bullets 上方单独一行，**无圆点、`font-weight: bold`**。
- 分页仍按条目边界；总结句与同条 bullets 尽量不分家（沿用现有 entry 级 break 策略）。
- 编辑器：每条工作/项目在 bullets 上方增加「总结句」单行输入（可空）；有内容时预览即时反映。
- 教育等板块不动。

## 总结句 AI 优化

与现有每条 bullet 旁 AI 按钮同交互：

- 总结句输入框旁放置同款 AI 触发按钮。
- 新增 `EditTarget`：

```ts
| {
    scope: "summary";
    sectionId: "work" | "project";
    entryId: string;
    entryVersionId: string;
  }
```

- 复用现有 AI 弹层、adaptive（`ready` / `needs_input`）、Diff 应用流程。
- 切片读写只针对该条 `summary`；不改同条 `bullets`。
- 空 `summary` 也可触发：可基于同条 bullets 与职位/角色等上下文生成一句总述（仍走 adaptive，禁止虚构关键事实）。
- 快捷指令：可复用 bullet 提示，并增加少量 summary 专用（如「更概括」「突出成果」）。
- `describeAIEditTarget` / `getEditSlice` / `applyAIEdit` / 服务端 edit-section 均需识别 `scope: "summary"`。

整条 section 级 AI 改写若触及 work/project entries，应保留并允许更新 `summary` 字段（与 bullets 并列），避免丢字段。

## 成功标准

- 有 `summary` 的条目：屏幕预览与导出 PDF 首行无圆点且加粗。
- 旧简历无总结句时行为与现网一致。
- 总结句旁 AI 可生成/改写并经 Diff 应用，仅更新该字段。

## 验证

- 单测：归一化提升 / 不提升；variant 含 `summary` 的 round-trip；`getEditSlice`/`applyAIEdit` 对 `scope: "summary"`。
- 手工：编辑器输入总结句 → 预览加粗无点 → 导出 PDF 一致；点 AI → Diff → 应用。
