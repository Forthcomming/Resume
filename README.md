# ResumeKit

模块化简历优化工具：结构化板块编辑、多版本管理、JD 定向匹配检查、AI 改写与 PDF 导出。

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。构建与检查：`npm run build` / `npm run lint`。

配置：在 `.env.local` 填写 Supabase 相关变量。DeepSeek API Key 由用户在设置页自行填写（BYOK），也可选配服务端 `DEEPSEEK_API_KEY`。

## 技术栈

Next.js 14 · React 18 · TypeScript · Tailwind · Supabase · DeepSeek · html2canvas/jspdf

## 文档

- 产品与架构：`docs/ARCHITECTURE.md`、`docs/resume-optimizer-prd.md`（PRD 为历史需求，实现以 ARCHITECTURE 为准）
- 设计系统：`docs/resumekit-design-system-vyra.md`
- Agent 约定：`AGENTS.md`
