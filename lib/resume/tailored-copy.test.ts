import { describe, expect, it } from "vitest";
import { emptyResumeContent } from "@/lib/resume/content";
import {
  addSectionSubVersion,
  getActiveSectionVersionId,
  initSectionSubVersionsStore,
} from "@/lib/resume/versions";
import { createWorkspaceFingerprint } from "@/lib/resume/tailoring";
import { buildTailoredWorkspace } from "@/lib/resume/tailored-copy";
import type { JdAdaptationPlan } from "@/types/jd-tailoring";

function fixture() {
  const content = emptyResumeContent();
  content.work.entries = [
    {
      company: "示例科技",
      title: "产品实习生",
      location: "北京",
      startDate: "2025-01",
      endDate: "2025-06",
      bullets: ["负责需求分析"],
    },
  ];
  let store = initSectionSubVersionsStore(content);
  const defaultId = getActiveSectionVersionId(store, "work");
  store = addSectionSubVersion(store, "work", "数据侧", {
    content: {
      entries: [
        {
          ...content.work.entries[0],
          bullets: ["搭建用户行为漏斗"],
        },
      ],
    },
  });
  const dataId = getActiveSectionVersionId(store, "work");
  const fingerprint = createWorkspaceFingerprint("主简历", content, store);
  const plan: JdAdaptationPlan = {
    sourceFingerprint: fingerprint,
    jobTitle: "数据产品经理",
    companyName: "示例公司",
    requirements: [],
    evidence: [],
    targetVersionBySection: { work: dataId },
    actions: [
      {
        id: "switch-1",
        type: "switch_version",
        sectionId: "work",
        fromVersionId: defaultId,
        toVersionId: dataId,
        reason: "数据经历更匹配",
        requirementIds: [],
      },
      {
        id: "rewrite-1",
        type: "rewrite_bullet",
        sectionId: "work",
        versionId: dataId,
        entryIndex: 0,
        bulletIndex: 0,
        original: "搭建用户行为漏斗",
        suggested: "搭建用户行为漏斗并定位转化瓶颈",
        reason: "强化结果",
        requirementIds: [],
      },
    ],
  };
  return { content, store, plan, fingerprint };
}

describe("buildTailoredWorkspace", () => {
  it("applies only selected actions without mutating the source", () => {
    const { content, store, plan, fingerprint } = fixture();
    const before = JSON.parse(JSON.stringify(store));
    const result = buildTailoredWorkspace({
      sourceTitle: "主简历",
      sourceContent: content,
      sourceStore: store,
      expectedFingerprint: fingerprint,
      plan,
      selected: {
        switchActionIds: ["switch-1"],
        rewriteActionIds: [],
      },
      outputTitle: " 示例公司·数据产品经理 ",
    });

    expect(result.title).toBe("示例公司·数据产品经理");
    expect(result.content.work.entries[0].bullets[0]).toBe("搭建用户行为漏斗");
    expect(store).toEqual(before);
  });

  it("rejects a stale source workspace", () => {
    const { content, store, plan, fingerprint } = fixture();
    expect(() =>
      buildTailoredWorkspace({
        sourceTitle: "已改名",
        sourceContent: content,
        sourceStore: store,
        expectedFingerprint: fingerprint,
        plan,
        selected: { switchActionIds: [], rewriteActionIds: [] },
        outputTitle: "定制版",
      })
    ).toThrow("母版内容已更新");
  });

  it("requires an output title", () => {
    const { content, store, plan, fingerprint } = fixture();
    expect(() =>
      buildTailoredWorkspace({
        sourceTitle: "主简历",
        sourceContent: content,
        sourceStore: store,
        expectedFingerprint: fingerprint,
        plan,
        selected: { switchActionIds: [], rewriteActionIds: [] },
        outputTitle: " ",
      })
    ).toThrow("请填写新简历名称");
  });
});
