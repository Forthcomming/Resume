# ResumeKit Glassmorphism UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变业务逻辑和布局结构的前提下，为 ResumeKit 全站建立统一、克制且清晰的冷蓝玻璃拟态材质。

**Architecture:** 在 `app/globals.css` 集中定义三个玻璃材质类，组件只负责选择合适层级。保留 Tailwind 现有颜色、圆角与响应式结构，不引入新依赖，不修改简历预览和导出链路。

**Tech Stack:** Next.js 14、React 18、Tailwind CSS 3、原生 CSS `backdrop-filter`

## Global Constraints

- 不改变路由、文案、字段、业务状态或组件层级。
- 不增加第三方依赖。
- 不修改简历数据结构、保存逻辑、AI 流程和 PDF 导出实现。
- 简历预览纸张保持纯白。
- 面板圆角约 16px，控件圆角 10-12px，主要按钮保持胶囊形。
- 不使用霓虹外发光或持续动画。
- 未经用户明确要求不创建 Git commit。

---

### Task 1: 建立全局玻璃材质系统

**Files:**
- Modify: `app/globals.css:5-32`
- Modify: `tailwind.config.ts:59-68`

**Interfaces:**
- Produces: CSS 类 `.glass-surface`、`.glass-panel`、`.glass-control`
- Produces: Tailwind 阴影 token `shadow-glass`、`shadow-glass-hover`

- [ ] **Step 1: 扩展全局背景与玻璃材质**

在 `app/globals.css` 中增加固定的冷蓝光斑背景，并在 `@layer components` 中定义三个材质类：

```css
@layer components {
  .glass-surface {
    border: 1px solid rgb(255 255 255 / 0.55);
    background: linear-gradient(135deg, rgb(255 255 255 / 0.62), rgb(240 247 255 / 0.38));
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.72), 0 12px 36px rgb(53 89 128 / 0.10);
    backdrop-filter: blur(20px) saturate(145%);
    -webkit-backdrop-filter: blur(20px) saturate(145%);
  }

  .glass-panel {
    border: 1px solid rgb(255 255 255 / 0.68);
    background: linear-gradient(145deg, rgb(255 255 255 / 0.76), rgb(245 250 255 / 0.52));
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.85), 0 10px 30px rgb(53 89 128 / 0.10);
    backdrop-filter: blur(16px) saturate(135%);
    -webkit-backdrop-filter: blur(16px) saturate(135%);
  }

  .glass-control {
    border: 1px solid rgb(255 255 255 / 0.76);
    background: rgb(255 255 255 / 0.70);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.90), 0 4px 14px rgb(53 89 128 / 0.07);
    backdrop-filter: blur(12px) saturate(125%);
    -webkit-backdrop-filter: blur(12px) saturate(125%);
  }
}
```

- [ ] **Step 2: 添加不支持透明模糊时的回退**

```css
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-surface,
  .glass-panel,
  .glass-control {
    background: rgb(247 250 254 / 0.96);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .glass-surface,
  .glass-panel,
  .glass-control {
    background: rgb(247 250 254 / 0.96);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
```

- [ ] **Step 3: 在 Tailwind 中增加统一 hover 阴影**

```ts
glass: "inset 0 1px 0 rgba(255,255,255,0.85), 0 10px 30px rgba(53,89,128,0.10)",
"glass-hover": "inset 0 1px 0 rgba(255,255,255,0.92), 0 16px 40px rgba(53,89,128,0.15)",
```

- [ ] **Step 4: 运行构建验证 CSS 与配置**

Run: `npm run build`

Expected: 构建成功，无 Tailwind 配置或 CSS 语法错误。

---

### Task 2: 应用到仪表盘、设置页与编辑器

**Files:**
- Modify: `components/layout/TopNav.tsx:23`
- Modify: `components/dashboard/SearchBar.tsx:16`
- Modify: `components/dashboard/ResumeCard.tsx:98-143`
- Modify: `components/dashboard/NewResumeCard.tsx:13`
- Modify: `components/dashboard/NewResumeDialog.tsx:48,192,333`
- Modify: `components/settings/ApiKeySettingsForm.tsx:47,62,86`
- Modify: `components/resume/editor/ResumeEditor.tsx:555-568`
- Modify: `components/resume/editor/EditorTopBar.tsx:50`
- Modify: `components/resume/editor/SectionEditorCard.tsx:95-100`
- Modify: `components/resume/editor/JDPanel.tsx:11,41-46`
- Modify: `components/resume/editor/AIModal.tsx:79`

**Interfaces:**
- Consumes: `.glass-surface`、`.glass-panel`、`.glass-control`
- Produces: 统一的应用端玻璃层级，不改变任何组件 Props 或事件

- [ ] **Step 1: 替换导航与页面级表面**

```tsx
className="glass-surface sticky top-0 z-50 h-[52px]"
```

编辑器顶栏使用同一 `glass-surface`，左侧工作区保留半透明底色并增强模糊与边缘分隔。

- [ ] **Step 2: 替换卡片与设置面板**

简历卡片、设置面板、编辑区块、创建弹窗主体和 AI 弹窗主体使用：

```tsx
className="glass-panel ..."
```

保留原有尺寸、圆角、状态类和所有事件处理。

- [ ] **Step 3: 替换输入框与浮层控件**

搜索框、API Key 输入框、菜单、弹窗输入框和 JD 输入区域使用：

```tsx
className="glass-control ..."
```

焦点环、错误色和 disabled 状态保持原样。

- [ ] **Step 4: 增加克制的卡片反馈**

只在可点击卡片上加入：

```tsx
className="transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:shadow-glass-hover active:translate-y-0"
```

不可点击面板不增加位移动效。

- [ ] **Step 5: 确认简历预览未被修改**

检查 `components/resume/editor/ResumePreview.tsx` 无 diff，确保打印根节点仍为白色。

- [ ] **Step 6: 运行构建验证应用端组件**

Run: `npm run build`

Expected: 构建成功，TypeScript 无错误。

---

### Task 3: 应用到落地页核心表面

**Files:**
- Modify: `components/landing/LandingNav.tsx:8`
- Modify: `components/landing/HeroMockup.tsx:10`
- Modify: `components/landing/StoryCardsSection.tsx:21`
- Modify: `components/landing/FAQSection.tsx:18`
- Modify: `components/landing/FinalCTASection.tsx:7`

**Interfaces:**
- Consumes: `.glass-surface`、`.glass-panel`、`.glass-control`
- Produces: 与后台一致但保持 landing token 的落地页材质

- [ ] **Step 1: 更新落地页导航与 Hero 展示框**

导航使用 `glass-surface`，Hero 主展示框使用 `glass-panel`。保留 `landing-*` 文字色与按钮色。

- [ ] **Step 2: 更新内容卡片、FAQ 与 CTA**

```tsx
className="glass-panel ..."
```

移除冲突的实白背景和旧阴影，保留现有布局、渐变点缀、标签色与 FAQ 展开动画。

- [ ] **Step 3: 检查页面材质密度**

避免给正文段落和无层级容器添加玻璃卡片。玻璃只用于导航、Hero 展示、内容卡片、FAQ 容器和最终 CTA。

- [ ] **Step 4: 运行构建验证落地页**

Run: `npm run build`

Expected: 构建成功，所有 landing 组件正常编译。

---

### Task 4: 浏览器视觉与回归验证

**Files:**
- Verify: `app/page.tsx`
- Verify: `app/dashboard/page.tsx`
- Verify: `app/settings/page.tsx`
- Verify: `app/resume/[id]/page.tsx`

**Interfaces:**
- Consumes: 前三项任务的最终样式
- Produces: 视觉验收记录与无回归结论

- [ ] **Step 1: 检查落地页**

在 1440px 与 390px 宽度查看 `/`。确认导航、Hero、卡片、FAQ、CTA 层级清晰，无横向溢出。

- [ ] **Step 2: 检查仪表盘和设置页**

查看 `/dashboard` 与 `/settings`。确认背景能透过卡片被感知，输入框文字、placeholder 和按钮对比清晰。

- [ ] **Step 3: 检查编辑器**

进入真实 `/resume/[id]`。确认左栏形成玻璃工作区，区块边界清晰，右侧 A4 预览仍为纯白。

- [ ] **Step 4: 检查交互状态**

验证搜索框焦点、新建简历弹窗、卡片菜单、FAQ 展开、AI 弹窗、hover、active 与 disabled 状态。

- [ ] **Step 5: 最终构建**

Run: `npm run build`

Expected: 构建成功，退出码为 0。
