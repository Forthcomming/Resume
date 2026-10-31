import { describe, expect, it } from "vitest";
import { emptyResumeContent } from "@/lib/resume/content";
import { addEntryVersion, initSectionSubVersionsStore } from "@/lib/resume/versions";
import { sanitizeJdAdaptationPlan } from "@/lib/ai/jd-plan";

function fixture() {
  const content = emptyResumeContent();
  content.work.entries = [{ company: "示例科技", title: "产品实习生", location: "", startDate: "2025-01", endDate: "2025-06", bullets: ["负责需求分析"] }];
  let versionStore = initSectionSubVersionsStore(content); const entryId = versionStore.entrySections.work.order[0];
  versionStore = addEntryVersion(versionStore, "work", entryId, "数据侧", { content: { title: "产品实习生", summary: "", bullets: ["搭建用户漏斗"] } });
  return { title: "主简历", content, versionStore, companyName: "示例", jobTitle: "数据产品经理", entryId, versionId: versionStore.entrySections.work.entries[entryId].activeVersionId };
}

describe("JD adaptation plan v2", () => {
  it("keeps valid entry evidence and actions", () => {
    const context = fixture();
    const result = sanitizeJdAdaptationPlan({ requirements: [{ id: "r1", title: "指标分析", jdQuote: "建立指标体系", coverage: "weak" }], evidence: [{ source: "entry", requirementId: "r1", sectionId: "work", entryId: context.entryId, entryVersionId: context.versionId, bulletIndex: 0, text: "伪造文本" }], actions: [{ type: "rewrite_entry_bullet", sectionId: "work", entryId: context.entryId, versionId: context.versionId, bulletIndex: 0, suggested: "搭建用户漏斗并定位转化瓶颈", requirementIds: ["r1"] }] }, context);
    expect(result.evidence[0]).toMatchObject({ source: "entry", text: "搭建用户漏斗" });
    expect(result.actions[0].type).toBe("rewrite_entry_bullet");
  });
  it("drops invalid ids and missing-coverage rewrites", () => {
    const context = fixture();
    const result = sanitizeJdAdaptationPlan({ requirements: [{ id: "r1", title: "商业化", jdQuote: "商业化经验", coverage: "missing" }], evidence: [{ requirementId: "r1", sectionId: "work", entryId: "bad", entryVersionId: "bad", bulletIndex: 0 }], actions: [{ type: "rewrite_entry_bullet", sectionId: "work", entryId: context.entryId, versionId: context.versionId, bulletIndex: 0, suggested: "新增商业化成绩", requirementIds: ["r1"] }] }, context);
    expect(result.evidence).toEqual([]); expect(result.actions).toEqual([]);
  });
});
