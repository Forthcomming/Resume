# 编辑器 Ctrl/Cmd+B 行内加粗设计

## 目标

在简历编辑器文本控件中提供**所见即所得**加粗：`Ctrl+B` / `Cmd+B`。编辑界面直接显示加粗，不露出 `**`；存储仍为带成对 `**…**` 的纯字符串；预览与 PDF 同理解析。

## 范围

### 做

- `TextField`（text）/ `TextAreaField` / `SummaryField` / `BulletList` 使用轻量 `contentEditable`（`RichTextInput`）
- `Ctrl/Cmd+B` 切换浏览器 bold（`document.execCommand('bold')`）
- 读写：`markdownToEditableHtml` / `editableHtmlToMarkdown`；预览继续 `parseInlineBoldSegments`
- 最小单测：markdown↔html 往返、segments、toggle 辅助函数

### 不做

- 工具栏加粗按钮
- 斜体、链接、标题等其它格式
- 改数据库或 JSON schema（仍是 string）
- `redcowork-demo/`
- Tag 草稿输入保持原生 input（标签本身短，不做 WYSIWYG）

## 交互

| 场景 | 行为 |
|------|------|
| 选中后 Ctrl/Cmd+B | 界面切换加粗样式；存盘序列化为 `**…**` |
| 再按 | 取消加粗 |
| 单行字段 Enter | 阻止换行 |
| 粘贴 | 仅纯文本；单行压成一行 |

## 架构

1. `lib/resume/inline-bold.ts`：segments、markdown↔html、toggle（兼容旧逻辑/测）
2. `RichTextInput`：contentEditable，外部 value 变化时同步 DOM（聚焦中且自身发出的值不打断光标）
3. `ResumePreview`：`InlineBoldText` 渲染

## 成功标准

- 编辑简介等字段时看见真正加粗，看不到 `**`
- 刷新后仍正确加粗；预览/PDF 一致
- 存储 JSON 中仍是 `**…**` 字符串

## 验证

- 单测 html 往返与 segments
- 手工：简介 Ctrl+B → 编辑区加粗 → 预览加粗 → 导出 PDF
