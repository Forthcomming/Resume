import { describe, expect, it } from "vitest";
import { emptyResumeContent } from "@/lib/resume/content";
import {
  addSectionSubVersion,
  getActiveSectionContent,
  getActiveSectionVersionId,
  initSectionSubVersionsStore,
} from "@/lib/resume/versions";
import {
  applyTailoringActions,
  createWorkspaceFingerprint,
  defaultTailoredResumeTitle,
} from "@/lib/resume/tailoring";
import type { JdRecommendationAction } from "@/types/jd-tailoring";

function fixture() {
  const content = emptyResumeContent();
  content.work.entries = [
    {
      company: "示例科技",
      title: "产品实习生",
      location: "北京",
      startDate: "2025-01",
      endDate: "2025-06",
      bullets: ["负责产品需求分析"],
    },
  ];
  let store = initSectionSubVersionsStore(content);
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
  return { content, store };
}

describe("resume tailoring", () => {
  it("creates stable fingerprints and changes them with content", () => {
    const { content, store } = fixture();
    const first = createWorkspaceFingerprint("主简历", content, store);
    const changed = {
      ...content,
      summary: { text: "新增简介" },
    };

    expect(createWorkspaceFingerprint("主简历", content, store)).toBe(first);
    expect(createWorkspaceFingerprint("主简历", changed, store)).not.toBe(
      first
    );
  });

  it("switches versions and groups rewrites into one new AI version", () => {
    const { store } = fixture();
    const sourceVersionId = getActiveSectionVersionId(store, "work");
    const actions: JdRecommendationAction[] = [
      {
        id: "switch-1",
        type: "switch_version",
        sectionId: "work",
        fromVersionId: store.sections.work.versions[0].id,
        toVersionId: sourceVersionId,
        reason: "更匹配",
        requirementIds: ["req-1"],
      },
      {
        id: "rewrite-1",
        type: "rewrite_bullet",
        sectionId: "work",
        versionId: sourceVersionId,
        entryIndex: 0,
        bulletIndex: 0,
        original: "搭建用户行为漏斗",
        suggested: "搭建用户行为漏斗并定位转化瓶颈",
        reason: "强化指标分析",
        requirementIds: ["req-1"],
      },
    ];

    const before = JSON.parse(JSON.stringify(store));
    const result = applyTailoringActions(store, actions, "AI 产品版");

    expect(store).toEqual(before);
    expect(result.sections.work.versions).toHaveLength(3);
    expect(result.sections.work.versions.at(-1)?.createdBy).toBe("ai");
    expect(getActiveSectionContent(result, "work").entries[0].bullets[0]).toBe(
      "搭建用户行为漏斗并定位转化瓶颈"
    );
  });

  it("rejects stale bullet content", () => {
    const { store } = fixture();
    const versionId = getActiveSectionVersionId(store, "work");
    const action: JdRecommendationAction = {
      id: "rewrite-1",
      type: "rewrite_bullet",
      sectionId: "work",
      versionId,
      entryIndex: 0,
      bulletIndex: 0,
      original: "旧内容",
      suggested: "建议文本",
      reason: "强化表达",
      requirementIds: ["req-1"],
    };

    expect(() => applyTailoringActions(store, [action], "AI 产品版")).toThrow(
      "原始 Bullet 已变化"
    );
  });

  it("builds default tailored titles", () => {
    expect(defaultTailoredResumeTitle("字节跳动", "AI 产品经理")).toBe(
      "字节跳动·AI 产品经理"
    );
    expect(defaultTailoredResumeTitle("", "AI 产品经理")).toBe(
      "AI 产品经理·定制版"
    );
  });
});
