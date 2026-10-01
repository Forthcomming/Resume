import { describe, expect, it } from "vitest";
import { reorderList } from "@/lib/resume/reorder";

describe("reorderList", () => {
  it("moves items in both directions without mutating the input", () => {
    const input = ["a", "b", "c"] as const;

    expect(reorderList(input, 2, 0)).toEqual(["c", "a", "b"]);
    expect(reorderList(input, 0, 2)).toEqual(["b", "c", "a"]);
    expect(input).toEqual(["a", "b", "c"]);
  });

  it.each([
    [1, 1],
    [-1, 1],
    [1, -1],
    [3, 1],
    [1, 3],
  ])("returns the original reference for invalid move %i -> %i", (from, to) => {
    const input = ["a", "b", "c"];

    expect(reorderList(input, from, to)).toBe(input);
  });
});
