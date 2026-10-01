# Single campus resume preview (drop density presets)

## Goal

取消紧凑/标准/宽松三档；预览固定为校招密排版式，并再贴模板微调。

## Behavior

- 顶栏不再显示密度切换
- `store.density` 忽略（旧数据兼容，不再读写）
- 固定 CSS token（`resumeStyleCssVars`）
- 页眉：姓名居中；主联系行仅 `手机 | 邮箱`；头像右上角
- 默认日期展示 `YYYY.MM`
- 三栏经历行 + 中文板块标题底线（沿用）

## Out of scope

多模板、编辑器表单重排、bullet 自动加粗
