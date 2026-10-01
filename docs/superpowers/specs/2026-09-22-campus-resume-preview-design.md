# Campus-style resume preview

## Goal

预览/PDF 贴近校招密排模板：居中页眉、右上角头像、三栏经历行、更大可读字号。仅改预览层。

## Behavior

- 姓名居中加粗；联系方式居中 `手机 | 邮箱 | …`
- 头像绝对定位纸面右上角；无头像时姓名仍居中
- 板块标题：中文 + 通栏底线（无 uppercase tracking）
- 工作/项目/教育标题行：左机构 · 中职位/学历 · 右时间
- `density.ts` 三档字号整体上调，间距略收以保持密排

## Out of scope

编辑器表单、bullet 自动加粗、多模板切换
