import { describe, expect, it } from "vitest";
import { emptyResumeContent } from "@/lib/resume/content";
import {
  SECTION_IDS,
  addSectionSubVersion,
  composeFromSectionSubVersions,
  deleteSectionSubVersion,
  duplicateSectionSubVersion,
  getActiveSectionVersionId,
  getSectionVersions,
  initSectionSubVersionsStore,
  migrateLegacyVersionStore,
  parseSectionSubVersionsStore,
  renameSectionSubVersion,
  sanitizeSectionSubVersionsStore,
  setActiveSectionVersion,
} from "@/lib/resume/versions";

const content = {
  ...emptyResumeContent(),
  basic_info: { ...emptyResumeContent().basic_info, name: "小林" },
  summary: { text: "产品与数据复合背景" },
};

describe("section version store migration", () => {
  it("initializes one active default version per section and composes content", () => {
    const store = initSectionSubVersionsStore(content);

    expect(
      SECTION_IDS.every((id) => store.sections[id].versions.length === 1)
    ).toBe(true);
    expect(composeFromSectionSubVersions(store)).toEqual(content);
  });

  it("migrates a legacy whole-resume snapshot", () => {
    const legacy = {
      versions: [
        {
          id: "legacy-1",
          name: "数据产品版",
          content,
          createdAt: "2026-10-01T00:00:00.000Z",
        },
      ],
      compose: Object.fromEntries(
        SECTION_IDS.map((id) => [id, "legacy-1"])
      ),
    } as Parameters<typeof migrateLegacyVersionStore>[0];

    const store = migrateLegacyVersionStore(legacy);

    expect(composeFromSectionSubVersions(store)).toEqual(content);
    expect(store.sections.summary.versions[0].name).toBe("数据产品版");
  });

  it("migrates section-level work versions into stable entry versions", () => {
    const work = {
      company: "示例科技",
      title: "产品实习生",
      location: "北京",
      startDate: "2025-01",
      endDate: "2025-06",
      bullets: ["负责需求分析"],
    };
    const base = initSectionSubVersionsStore({
      ...content,
      work: { entries: [work] },
    });
    const v1 = {
      schemaVersion: 1,
      sectionOrder: base.sectionOrder,
      sectionTitles: {},
      sections: {
        ...base.sections,
        work: {
          activeVersionId: "product",
          versions: [
            { id: "product", name: "产品侧", createdAt: "2026-01-01", createdBy: "user", content: { entries: [work] } },
            { id: "data", name: "数据侧", createdAt: "2026-01-02", createdBy: "user", content: { entries: [{ ...work, bullets: ["搭建用户漏斗"] }] } },
          ],
        },
      },
    };
    const first = parseSectionSubVersionsStore(v1);
    const second = parseSectionSubVersionsStore(v1);
    expect(first?.schemaVersion).toBe(2);
    expect(first?.entrySections.work.order).toEqual(second?.entrySections.work.order);
    const entryId = first?.entrySections.work.order[0] ?? "";
    expect(first?.entrySections.work.entries[entryId].versions.map((item) => item.name)).toEqual(["产品侧", "数据侧"]);
    expect(composeFromSectionSubVersions(first!).work.entries[0].bullets).toEqual(["负责需求分析"]);
  });

  it("repairs incomplete duplicate order and drops deprecated density", () => {
    const base = initSectionSubVersionsStore(content);
    const store = sanitizeSectionSubVersionsStore({
      ...base,
      sectionOrder: ["work", "work", "summary", "invalid"],
      density: "compact",
    } as unknown as typeof base);

    expect(store.sectionOrder).toEqual([
      "work",
      "summary",
      "basic_info",
      "education",
      "project",
      "skills",
    ]);
    expect(store).not.toHaveProperty("density");
    expect(
      parseSectionSubVersionsStore({ ...base, density: "loose" })
    ).not.toHaveProperty("density");
  });
});

describe("section version operations", () => {
  it("creates, duplicates, switches, renames, and deletes within one section", () => {
    const initial = initSectionSubVersionsStore(content);
    const added = addSectionSubVersion(initial, "summary", "AI 产品版");
    const addedId = getActiveSectionVersionId(added, "summary");
    const duplicated = duplicateSectionSubVersion(added, "summary", addedId);
    const duplicateId = getActiveSectionVersionId(duplicated, "summary");
    const renamed = renameSectionSubVersion(
      duplicated,
      "summary",
      duplicateId,
      "数据产品版"
    );
    const switched = setActiveSectionVersion(renamed, "summary", addedId);
    const deleted = deleteSectionSubVersion(
      switched,
      "summary",
      duplicateId
    );

    expect(
      getSectionVersions(deleted, "summary").map((version) => version.name)
    ).toContain("AI 产品版");
    expect(
      getSectionVersions(deleted, "summary").map((version) => version.name)
    ).not.toContain("数据产品版");
    expect(getActiveSectionVersionId(deleted, "summary")).toBe(addedId);
    expect(deleted.sections.work).toEqual(initial.sections.work);
  });

  it("keeps the last version in a section", () => {
    const initial = initSectionSubVersionsStore(content);
    const onlyId = getActiveSectionVersionId(initial, "work");

    expect(deleteSectionSubVersion(initial, "work", onlyId)).toBe(initial);
  });
});
