import type { ResumeContent } from "@/lib/resume/content";
import {
  composeFromSectionSubVersions,
  type SectionSubVersionsStore,
} from "@/lib/resume/versions";
import {
  applyTailoringActions,
  createWorkspaceFingerprint,
} from "@/lib/resume/tailoring";
import type {
  JdAdaptationPlan,
  SelectedTailoringActions,
} from "@/types/jd-tailoring";

export interface TailoredWorkspace {
  title: string;
  content: ResumeContent;
  versionStore: SectionSubVersionsStore;
}

export function buildTailoredWorkspace(input: {
  sourceTitle: string;
  sourceContent: ResumeContent;
  sourceStore: SectionSubVersionsStore;
  expectedFingerprint: string;
  plan: JdAdaptationPlan;
  selected: SelectedTailoringActions;
  outputTitle: string;
}): TailoredWorkspace {
  const outputTitle = input.outputTitle.trim();
  if (!outputTitle) throw new Error("请填写新简历名称");

  const currentFingerprint = createWorkspaceFingerprint(
    input.sourceTitle,
    input.sourceContent,
    input.sourceStore
  );
  if (
    currentFingerprint !== input.expectedFingerprint ||
    currentFingerprint !== input.plan.sourceFingerprint
  ) {
    throw new Error("母版内容已更新，请重新生成适配方案");
  }

  const selectedIds = new Set(input.selected.actionIds);
  const selectedActions = input.plan.actions.filter((action) =>
    selectedIds.has(action.id)
  );

  const versionName = `${input.plan.jobTitle.trim() || "岗位定制"}版`;
  const versionStore = applyTailoringActions(
    input.sourceStore,
    selectedActions,
    versionName
  );

  return {
    title: outputTitle,
    content: composeFromSectionSubVersions(versionStore),
    versionStore,
  };
}
