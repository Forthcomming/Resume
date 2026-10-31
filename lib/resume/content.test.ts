import { describe, expect, it } from "vitest";
import {
  looksLikeEntrySummary,
  maybePromoteEntrySummary,
  normalizeResumeContent,
} from "./content";

describe("entry summary normalize", () => {
  it("promotes a short first bullet when summary missing and more bullets remain", () => {
    expect(
      maybePromoteEntrySummary({
        bullets: ["负责核心交易链路体验", "推动改版上线", "搭建埋点"],
      })
    ).toEqual({
      summary: "负责核心交易链路体验",
      bullets: ["推动改版上线", "搭建埋点"],
    });
  });

  it("does not promote when only one bullet", () => {
    expect(maybePromoteEntrySummary({ bullets: ["负责需求分析"] })).toEqual({
      summary: "",
      bullets: ["负责需求分析"],
    });
  });

  it("does not promote laundry-list first bullets", () => {
    expect(looksLikeEntrySummary("负责需求、设计、开发、测试与上线等")).toBe(
      false
    );
  });

  it("keeps existing summary and does not strip bullets", () => {
    expect(
      maybePromoteEntrySummary({
        summary: "已有总结",
        bullets: ["A", "B"],
      })
    ).toEqual({ summary: "已有总结", bullets: ["A", "B"] });
  });

  it("normalizeResumeContent fills missing summary", () => {
    const content = normalizeResumeContent({
      work: {
        entries: [
          {
            company: "X",
            title: "Y",
            location: "",
            startDate: "",
            endDate: "",
            bullets: ["短总结句示例文本", "具体职责一"],
          },
        ],
      },
    });
    expect(content.work.entries[0].summary).toBeTruthy();
    expect(content.work.entries[0].bullets[0]).toBe("具体职责一");
  });
});
