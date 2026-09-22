# Fixed A4 paginated preview

## Goal

右侧预览纸面固定为真实 A4 尺寸；内容超出时叠多页裁切预览，不再随右栏宽度自适应缩放。

## Behavior

- 单页尺寸：`210mm × 297mm`（与导出 / `@page` 一致）
- 内容按固定宽度排版，测量总高后 `pageCount = max(1, ceil(height / pageHeight))`
- 右侧纵向排列多张纸，纸间小间隙；每页 `overflow: hidden` + `translateY` 裁切
- 页缝可能切断条目（与现有 html2canvas 分页语义一致）
- 右栏继续滚动浏览多页

## Implementation

- `lib/resume/a4.ts`：共享 A4 常量
- `ResumePreview`：隐藏测量/导出根节点（`data-resume-pdf-root` + `.resume-print-root`）+ 可见分页裁切层
- `ResumeEditor` 导出查询改为 `[data-resume-pdf-root]`（整段内容，非单页裁切窗）
- 不改 `downloadResumePdf` 分页算法；不改智能断点

## Out of scope

智能避让断点、预览缩放控件、改 PDF 切片算法
