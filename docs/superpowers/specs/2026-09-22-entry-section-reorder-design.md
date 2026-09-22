# 工作/项目条目拖拽 + 板块上移下移

## Goal

让工作经历、项目经历的**条目**可拖拽换序；让所有**板块**（含基本信息）通过上移/下移换序。教育等其它条目不做排序。零新依赖，复用现有 HTML5 DnD 模式与 `onChange` / `sectionOrder` 持久化链路。

## Scope

**In**

- 工作 / 项目 `entries`：条目卡左侧 grip，按住把手才可拖，放置到目标条目位置即换序
- 全部板块（含 `basic_info`）：标题栏上移 / 下移；首项上移、末项下移 `disabled`
- 重排后右侧预览与自动保存沿用现有路径

**Out**

- 教育 / 技能等条目排序
- bullet 级排序
- 引入 DnD 库、键盘快捷键

## Behavior

### 条目（工作 / 项目）

- UI：`EntryCard` 可选 `reorderable`；仅这两类 form 开启
- 交互：对齐现板块拖拽——`mousedown` 在 grip 上才 `draggable`；拖入目标卡高亮；`drop` 后按 index `splice`
- 数据：`content.work.entries` / `content.project.entries` 新数组 → 现有 `onChange` → 预览与 save

### 板块

- 去掉 `SectionEditorCard` 的 grip 与 HTML5 DnD
- 标题栏加「上移」「下移」（图标按钮即可，`aria-label` 明确）
- `basic_info` 可参与排序；**取消**「基本信息永远置顶」约束
- `sanitizeSectionOrder` / `reorderSections` / `ResumeEditor` 中所有 pin / 跳过 `basic_info` 的逻辑一并移除
- 预览按完整 `sectionOrder` 渲染：`basic_info` 出现在哪一段，就在该位置使用现有 header 视觉块；其余板块仍用 body 块

## Architecture

| 单元 | 职责 |
|------|------|
| `reorderList(list, from, to)` | 纯函数数组重排（`lib/resume/reorder.ts`） |
| `reorderSections` | 用 `reorderList` 更新 `sectionOrder`，不再 pin `basic_info` |
| `EntryCard` | 可选 grip + DnD props |
| `WorkExperienceForm` / `ProjectForm` | 条目 DnD 状态与 `onChange({ entries })` |
| `SectionEditorCard` | 上移/下移按钮，去掉拖拽 |
| `ResumeEditor` | `handleMoveSection(id, direction)`；去掉板块 dragging 状态 |
| `ResumePreview` | 按完整 order 渲染，含可移动的 `basic_info` |

## Edge cases

- `from === to` 或越界：no-op
- 仅 1 个条目：无可用放置目标（仍显示 grip，拖放无效或仅自身）
- 板块位于顶/底：对应按钮 `disabled`
- 条目拖拽与输入框：非 grip 区域不可启动拖拽，避免选中文本冲突

## Testing

仓库暂无单测框架。以手动验证为主：

1. 工作经历 1↔2 拖换，预览顺序同步，刷新后仍保持
2. 项目经历同上
3. 教育条目无 grip
4. 板块上移/下移含基本信息；顶/底按钮禁用
5. 将基本信息移到非首位后，预览中姓名块位置与 order 一致
