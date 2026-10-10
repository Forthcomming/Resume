import { describe, expect, it } from "vitest";
import { calculateResumePageCount } from "./pagination";

describe("calculateResumePageCount", () => {
  it("does not create a blank page for trailing container padding", () => {
    expect(calculateResumePageCount(1084.45, 1122.52)).toBe(1);
  });

  it("creates another page when visible content crosses the page boundary", () => {
    expect(calculateResumePageCount(1124, 1122.52)).toBe(2);
  });

  it("falls back to one page when the page height is unavailable", () => {
    expect(calculateResumePageCount(1200, 0)).toBe(1);
  });
});
