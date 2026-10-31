import { describe, expect, it } from "vitest";
import { emptyResumeContent } from "@/lib/resume/content";
import { addEntryVersion, composeFromSectionSubVersions, initSectionSubVersionsStore } from "@/lib/resume/versions";
import { applyTailoringActions, createWorkspaceFingerprint, defaultTailoredResumeTitle } from "@/lib/resume/tailoring";
import type { JdRecommendationAction } from "@/types/jd-tailoring";

function fixture() {
  const content = emptyResumeContent();
  content.work.entries = [{ company: "示例科技", title: "产品实习生", location: "北京", startDate: "2025-01", endDate: "2025-06", bullets: ["负责产品需求分析"] }];
  let store = initSectionSubVersionsStore(content);
  const entryId = store.entrySections.work.order[0];
  store = addEntryVersion(store, "work", entryId, "数据侧", { content: { title: "产品实习生", summary: "", bullets: ["搭建用户行为漏斗"] } });
  return { content, store, entryId, dataVersionId: store.entrySections.work.entries[entryId].activeVersionId };
}

describe("resume tailoring v2", () => {
  it("fingerprints modular workspaces", () => {
    const { content, store } = fixture();
    expect(createWorkspaceFingerprint("主简历", content, store)).toBe(createWorkspaceFingerprint("主简历", content, store));
    expect(createWorkspaceFingerprint("主简历", content, store)).not.toBe(createWorkspaceFingerprint("改名", content, store));
  });

  it("switches an entry version and creates one AI rewrite version", () => {
    const { store, entryId, dataVersionId } = fixture();
    const actions: JdRecommendationAction[] = [
      { id: "a1", type: "switch_entry_version", sectionId: "work", entryId, fromVersionId: store.entrySections.work.entries[entryId].versions[0].id, toVersionId: dataVersionId, reason: "更匹配", requirementIds: ["r1"] },
      { id: "a2", type: "rewrite_entry_bullet", sectionId: "work", entryId, versionId: dataVersionId, bulletIndex: 0, original: "搭建用户行为漏斗", suggested: "搭建用户行为漏斗并定位转化瓶颈", reason: "强化结果", requirementIds: ["r1"] },
    ];
    const before = JSON.parse(JSON.stringify(store));
    const result = applyTailoringActions(store, actions, "数据产品经理版");
    expect(store).toEqual(before);
    expect(result.entrySections.work.entries[entryId].versions).toHaveLength(3);
    expect(composeFromSectionSubVersions(result).work.entries[0].bullets[0]).toContain("转化瓶颈");
  });

  it("ignores rewrites for an entry selected to hide", () => {
    const { store, entryId, dataVersionId } = fixture();
    const result = applyTailoringActions(store, [
      { id: "a1", type: "set_entry_enabled", sectionId: "work", entryId, enabled: false, reason: "弱相关", requirementIds: [] },
      { id: "a2", type: "rewrite_entry_bullet", sectionId: "work", entryId, versionId: dataVersionId, bulletIndex: 0, original: "搭建用户行为漏斗", suggested: "改写", reason: "", requirementIds: [] },
    ], "岗位版");
    expect(composeFromSectionSubVersions(result).work.entries).toHaveLength(0);
    expect(result.entrySections.work.entries[entryId].versions).toHaveLength(2);
  });

  it("builds default titles", () => {
    expect(defaultTailoredResumeTitle("字节跳动", "AI 产品经理")).toBe("字节跳动·AI 产品经理");
  });
});
