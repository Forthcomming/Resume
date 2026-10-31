# 编辑器 Ctrl/Cmd+B 行内加粗设计

## 目标

在简历编辑器文本控件中提供普适的加粗快捷键：`Ctrl+B`（Windows）/ `Cmd+B`（macOS）。内容仍以纯字符串存储，用成对 `**…**` 标记；预览与 PDF 将标记渲成加粗。

## 范围

### 做

- 共用文本控件支持快捷键：`TextField`、`TextAreaField`、`SummaryField`、`BulletList` 行、`TagInput` 草稿输入（及同类受控 input/textarea）
- 选区切换加粗标记；无选区插入 `****` 并将光标置于中间
- 已是成对包裹选区时再次快捷键则去掉两侧 `**`
- 预览 / PDF：仅解析成对 `**加粗**` 为加粗节点；未闭合的 `**` 按原文显示
- 最小单测：包裹 / 取消包裹 / 无选区插入；渲染拆分

### 不做

- 工具栏加粗按钮
- 斜体、链接、标题等其它 Markdown
- 富文本 / contentEditable 替换
- 改数据库或 JSON schema（仍是 string）
- `redcowork-demo/`

## 交互

| 场景 | 行为 |
|------|------|
| 有选区且两侧不是成对 `**` | 选区变为 `**选区**`；操作后选区覆盖**含两侧 `**` 的整段**，便于连续再按取消 |
| 有选区且恰好已被 `**…**` 包裹 | 去掉该对 `**`；操作后选区覆盖去标记后的原文 |
| 无选区 | 在光标处插入 `****`，光标落在两对星号中间 |
| 焦点不在可编辑文本控件 | 不拦截浏览器默认行为 |

仅响应 `Ctrl+B` / `Meta+B`；`Shift` 等组合不扩展范围。

## 架构

1. **纯函数**（如 `lib/resume/inline-bold.ts`）
   - `toggleInlineBoldMarkdown(value, selectionStart, selectionEnd) => { value, selectionStart, selectionEnd }`
   - `renderInlineBold(text) => ReactNode` 或拆成 segments `{ type: "text" \| "bold"; value: string }[]`
2. **控件**：在共用 field 的 `onKeyDown` 中调用 toggle，写回 `onChange`，并用 `requestAnimationFrame`/`setSelectionRange` 恢复选区
3. **预览**：`ResumePreview`（及 bullets / summary / 简介等文本出口）对用户可见字符串走 `renderInlineBold`；导出 PDF 共用该 DOM

## 成功标准

- 任意接入的文本框：选中后 `Ctrl/Cmd+B` 可见 `**` 标记，再按可取消
- 预览与导出 PDF 中成对标记显示为加粗，星号本身不露出
- 未接入的非文本控件行为不变

## 验证

- 单测覆盖 toggle 三种场景与 render 拆分（含未闭合 `**`）
- 手工：简介 / bullet / 总结句 / 基本信息字段加粗后预览与导出一致
