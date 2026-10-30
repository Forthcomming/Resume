import { describe, expect, it } from "vitest";
import { planPdfPageSlices } from "@/lib/resume/export-pdf";

describe("planPdfPageSlices", () => {
  it("returns a single page when content fits", () => {
    expect(planPdfPageSlices(800, 1000, [200, 500, 800])).toEqual([
      { startPx: 0, endPx: 800 },
    ]);
  });

  it("prefers the last safe break within a page window", () => {
    expect(
      planPdfPageSlices(2000, 1000, [0, 400, 900, 1300, 1800, 2000])
    ).toEqual([
      { startPx: 0, endPx: 900 },
      { startPx: 900, endPx: 1800 },
      { startPx: 1800, endPx: 2000 },
    ]);
  });

  it("falls back to a hard cut when no useful safe break exists", () => {
    expect(planPdfPageSlices(2500, 1000, [0, 100, 2500])).toEqual([
      { startPx: 0, endPx: 1000 },
      { startPx: 1000, endPx: 2000 },
      { startPx: 2000, endPx: 2500 },
    ]);
  });
});
