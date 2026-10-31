import { describe, expect, it } from "vitest";
import { extractAIEditDisplayValue } from "./display-value";

describe("extractAIEditDisplayValue", () => {
  it("extracts summary string for summary scope", () => {
    expect(
      extractAIEditDisplayValue(
        {
          scope: "summary",
          sectionId: "work",
          entryId: "e1",
          entryVersionId: "v1",
        },
        { entries: [{ summary: "一句总述", bullets: ["a"] }] }
      )
    ).toBe("一句总述");
  });
});
