import {
  User,
  AlignLeft,
  Briefcase,
  GraduationCap,
  FolderKanban,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { SectionType } from "@/types/resume";

export interface EditorSection {
  id: string;
  type: SectionType;
  title: string;
  icon: LucideIcon;
}
export const EDITOR_SECTIONS: EditorSection[] = [
  { id: "basic_info", type: "basic_info", title: "基本信息", icon: User },
  { id: "summary", type: "summary", title: "个人简介", icon: AlignLeft },
  { id: "work", type: "work_experience", title: "工作经历", icon: Briefcase },
  { id: "education", type: "education", title: "教育经历", icon: GraduationCap },
  { id: "project", type: "project", title: "项目经历", icon: FolderKanban },
  { id: "skills", type: "skills", title: "技能", icon: Wrench },
];

export const AI_QUICK_PROMPTS = [
  "量化数据，强化成果",
  "精简表达，突出重点",
  "针对产品岗优化",
];
