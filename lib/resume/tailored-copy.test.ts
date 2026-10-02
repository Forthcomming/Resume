import { describe, expect, it } from "vitest";
import { emptyResumeContent } from "@/lib/resume/content";
import { initSectionSubVersionsStore } from "@/lib/resume/versions";
import { createWorkspaceFingerprint } from "@/lib/resume/tailoring";
import { buildTailoredWorkspace } from "@/lib/resume/tailored-copy";
import type { JdAdaptationPlan } from "@/types/jd-tailoring";

function fixture() {
  const content = emptyResumeContent();
  content.project.entries = [{ name: "ResumeKit", role: "负责人", startDate: "2026-01", endDate: "2026-06", techStack: ["Next.js"], link: "", bullets: ["完成简历编辑器"] }];
  const store = initSectionSubVersionsStore(content);
  const entryId = store.entrySections.project.order[0];
  const fingerprint = createWorkspaceFingerprint("主简历", content, store);
  const plan: JdAdaptationPlan = { sourceFingerprint: fingerprint, jobTitle: "AI 产品经理", companyName: "示例", requirements: [], evidence: [], actions: [{ id: "hide", type: "set_entry_enabled", sectionId: "project", entryId, enabled: false, reason: "弱相关", requirementIds: [] }] };
  return { content, store, fingerprint, plan };
}

describe("buildTailoredWorkspace v2", () => {
  it("applies selected actions without mutating source", () => {
    const { content, store, fingerprint, plan } = fixture(); const before = JSON.parse(JSON.stringify(store));
    const result = buildTailoredWorkspace({ sourceTitle: "主简历", sourceContent: content, sourceStore: store, expectedFingerprint: fingerprint, plan, selected: { actionIds: ["hide"] }, outputTitle: "定制版" });
    expect(result.content.project.entries).toHaveLength(0); expect(store).toEqual(before);
  });
  it("rejects stale sources and blank titles", () => {
    const { content, store, fingerprint, plan } = fixture();
    expect(() => buildTailoredWorkspace({ sourceTitle: "改名", sourceContent: content, sourceStore: store, expectedFingerprint: fingerprint, plan, selected: { actionIds: [] }, outputTitle: "定制版" })).toThrow("母版内容已更新");
    expect(() => buildTailoredWorkspace({ sourceTitle: "主简历", sourceContent: content, sourceStore: store, expectedFingerprint: fingerprint, plan, selected: { actionIds: [] }, outputTitle: " " })).toThrow("请填写新简历名称");
  });
});
