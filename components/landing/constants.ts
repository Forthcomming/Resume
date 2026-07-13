export const NAV_LINKS = [
  { label: "核心功能", href: "#features" },
  { label: "工作流程", href: "#workflow" },
  { label: "用户评价", href: "#stories" },
  { label: "常见问题", href: "#faq" },
] as const;

export const STATS = [
  { value: "87%", label: "平均匹配度提升" },
  { value: "2,400+", label: "生成变体数" },
  { value: "12min", label: "平均省时" },
] as const;

export const FEATURES = [
  {
    title: "AI 智能优化",
    description:
      "根据目标岗位 JD，自动改写经历描述、强化关键词与量化成果，让每一份简历都更贴合岗位。",
    accent: "blue" as const,
    icon: "sparkles",
  },
  {
    title: "多行业模板",
    description:
      "覆盖互联网、金融、设计等主流行业的结构化模板，一键切换版式，保持专业排版。",
    accent: "teal" as const,
    icon: "layout",
  },
  {
    title: "实时预览与导出",
    description:
      "编辑即预览，所见即所得。支持一键导出 PDF，投递前随时核对最终效果。",
    accent: "purple" as const,
    icon: "eye",
  },
  {
    title: "ATS 友好监测",
    description:
      "检测简历是否便于 ATS 解析，提示格式与关键词风险，降低被系统筛掉的概率。",
    accent: "amber" as const,
    icon: "shield",
  },
] as const;

export const WORKFLOW_STEPS = [
  { label: "导入简历", accent: "blue" as const },
  { label: "岗位分析", accent: "teal" as const },
  { label: "AI 优化", accent: "purple" as const },
  { label: "人工微调", accent: "amber" as const },
  { label: "成功投递", accent: "ink" as const },
] as const;

export const MATCH_BULLETS = [
  "深度语义理解岗位要求，而非简单关键词堆砌",
  "自动对齐技能、经历与 JD 核心能力模型",
  "匹配度可视化，优化前后效果一目了然",
] as const;

export const STORY_CARDS = [
  {
    role: "产品经理",
    accent: "blue" as const,
    company: "某互联网公司 · 产品实习",
    bullets: [
      "主导新功能从 0 到 1，完成需求调研与方案评审",
      "推动跨部门协作，上线后 DAU 提升 18%",
      "用数据验证假设，迭代 3 轮核心交互流程",
    ],
  },
  {
    role: "数据分析师",
    accent: "teal" as const,
    company: "某互联网公司 · 产品实习",
    bullets: [
      "搭建用户行为漏斗，定位转化瓶颈并输出优化建议",
      "用 SQL / Python 完成 A/B 实验分析，支撑产品决策",
      "沉淀周报指标看板，缩短汇报准备时间 40%",
    ],
  },
  {
    role: "交互设计师",
    accent: "purple" as const,
    company: "某互联网公司 · 产品实习",
    bullets: [
      "负责核心玩法交互设计，输出高保真原型与设计规范",
      "完成横竖屏适配方案，覆盖 12+ 核心页面",
      "与研发紧密协作，保障交互还原度与落地效率",
    ],
  },
] as const;

export const FAQS = [
  {
    question: "ResumeKit 和其他简历工具有什么不同？",
    answer:
      "我们专注「一份主简历 → 多岗位定制变体」。以结构化板块库为基础，结合 JD 语义匹配与 AI 改写，让你为每个岗位快速生成针对性版本，而不是反复改同一份文档。",
  },
  {
    question: "免费额度包含哪些功能？",
    answer:
      "注册即可获得 5 次免费 AI 优化次数，可用于板块润色、按 JD 定制等核心能力。额度用尽后可继续手动编辑与导出。",
  },
  {
    question: "我的简历数据安全吗？",
    answer:
      "简历内容仅用于为你提供编辑与优化服务，不会用于对外展示。传输与存储遵循行业常见安全实践，你可随时删除自己的简历数据。",
  },
  {
    question: "支持导出哪些格式？",
    answer:
      "目前支持导出为 PDF，版式与编辑预览保持一致，便于直接投递。后续会按需求扩展更多格式。",
  },
  {
    question: "没有现成简历可以开始吗？",
    answer:
      "可以。你可以在 Dashboard 新建空白简历，按板块填写经历与技能，再针对目标岗位用 AI 生成定制变体。",
  },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "产品",
    links: ["核心功能", "工作流程", "定价", "更新日志"],
  },
  {
    title: "公司",
    links: ["关于我们", "加入我们", "联系方式", "媒体资料"],
  },
  {
    title: "资源",
    links: ["使用指南", "简历模板", "求职博客", "API 文档"],
  },
  {
    title: "支持",
    links: ["帮助中心", "常见问题", "隐私政策", "服务条款"],
  },
] as const;

export const SOCIAL_PROOF_AVATARS = [
  "from-sky-400 to-blue-500",
  "from-teal-400 to-emerald-500",
  "from-violet-400 to-purple-500",
  "from-amber-400 to-orange-500",
] as const;
