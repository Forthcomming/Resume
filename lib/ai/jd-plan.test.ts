import { describe, expect, it } from "vitest";
import { emptyResumeContent } from "@/lib/resume/content";
import { sanitizeJdAdaptationPlan } from "@/lib/ai/jd-plan";
import {
  addSectionSubVersion,
  getActiveSectionVersionId,
  initSectionSubVersionsStore,
} from "@/lib/resume/versions";

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
  const productId = getActiveSectionVersionId(store, "work");
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
  return { content, store, productId, dataId };
}

describe("sanitizeJdAdaptationPlan", () => {
  it("resolves real evidence and a valid global switch", () => {
    const { content, store, productId, dataId } = fixture();
    const plan = sanitizeJdAdaptationPlan(
      {
        requirements: [
          {
            id: "r-data",
            title: "指标分析",
            jdQuote: "建立业务指标体系",
            importance: "core",
            coverage: "weak",
          },
        ],
        evidence: [
          {
            requirementId: "r-data",
            sectionId: "work",
            versionId: dataId,
            entryIndex: 0,
            bulletIndex: 0,
            text: "AI 伪造文本",
            reason: "体现数据分析",
          },
        ],
        targetVersionBySection: { work: dataId },
        actions: [
          {
            type: "switch_version",
            sectionId: "work",
            fromVersionId: productId,
            toVersionId: dataId,
            reason: "数据侧更匹配",
            requirementIds: ["r-data"],
          },
        ],
      },
      {
        title: "主简历",
        content,
        versionStore: store,
        companyName: "字节跳动",
        jobTitle: "AI 产品经理",
      }
    );

    expect(plan.requirements[0].id).toBe("req-1");
    expect(plan.evidence[0]).toMatchObject({
      versionName: "数据侧",
      text: "搭建用户行为漏斗",
      isActive: true,
    });
    expect(plan.actions[0]).toMatchObject({
      type: "switch_version",
      toVersionId: dataId,
      requirementIds: ["req-1"],
    });
  });

  it("drops invalid references and rewrites for missing requirements", () => {
    const { content, store, dataId } = fixture();
    const plan = sanitizeJdAdaptationPlan(
      {
        requirements: [
          {
            id: "r-missing",
            title: "商业化经验",
            jdQuote: "负责商业化增长",
            coverage: "missing",
          },
        ],
        evidence: [
          {
            requirementId: "r-missing",
            sectionId: "work",
            versionId: "not-found",
            text: "不存在",
          },
        ],
        actions: [
          {
            type: "rewrite_bullet",
            sectionId: "work",
            versionId: dataId,
            entryIndex: 0,
            bulletIndex: 0,
            original: "搭建用户行为漏斗",
            suggested: "负责商业化增长",
            requirementIds: ["r-missing"],
          },
        ],
      },
      {
        title: "主简历",
        content,
        versionStore: store,
        companyName: "",
        jobTitle: "产品经理",
      }
    );

    expect(plan.evidence).toEqual([]);
    expect(plan.actions).toEqual([]);
  });
});
