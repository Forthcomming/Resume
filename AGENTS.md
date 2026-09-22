# ResumeKit — Agent Notes

## 定位

模块化简历优化工具：结构化板块编辑、多版本、JD 定向检查、AI 改写、PDF 导出。

## 怎么跑

```bash
npm install
npm run dev    # 清 .next 后启动 Next dev
npm run build
npm run lint
```

需要 `.env.local` 里的 Supabase 配置；DeepSeek 走用户 BYOK（设置页 / localStorage），服务端也可读 `DEEPSEEK_API_KEY`。

## 技术栈

- Next.js 14 App Router + TypeScript + Tailwind
- Supabase Auth（匿名/SSR）+ Postgres + RLS
- AI：DeepSeek（解析 / 改写 / JD-check），非 Claude
- PDF：`html2canvas` + `jspdf`（浏览器端），非 Puppeteer
- 状态：React 本地 state + Supabase；无 Zustand / SWR

## 目录约定

- `app/` 页面与 Route Handlers；`components/resume/editor/` 编辑器主战场
- `lib/ai/` DeepSeek 与客户端薄封装；`lib/resume/` 数据与导出
- `types/` 共享类型；`docs/` 产品/架构说明（以 `docs/ARCHITECTURE.md` 与代码为准）
- Agent skills 在 `.agents/skills/`；勿往仓库根乱丢 `plan.md` / `todo.md`

## 当前状态

- 主闭环可用：dashboard、编辑器、板块版本、BYOK、PDF、JD-check
- 分支 `cursor/section-sub-versions`；样式与 JD-check 等改动可能仍在工作区
- 下一步优先：收 WIP、抽 DeepSeek 调用重复，而不是扩功能

## 红线

- 不提交 `.env.local`；不擅自清场删分支/目录（先列候选等确认）
- 用户未要文件时，计划/总结留在对话里
