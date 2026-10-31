import { describe, expect, it } from "vitest";
import {
  parseInlineBoldSegments,
  toggleInlineBoldMarkdown,
} from "./inline-bold";

describe("toggleInlineBoldMarkdown", () => {
  it("wraps a selection and expands the selection over markers", () => {
    expect(toggleInlineBoldMarkdown("hello world", 6, 11)).toEqual({
      value: "hello **world**",
      selectionStart: 6,
      selectionEnd: 15,
    });
  });

  it("unwraps when selection includes surrounding markers", () => {
    expect(toggleInlineBoldMarkdown("hello **world**", 6, 15)).toEqual({
      value: "hello world",
      selectionStart: 6,
      selectionEnd: 11,
    });
  });

  it("unwraps when markers sit just outside the selection", () => {
    expect(toggleInlineBoldMarkdown("hello **world**", 8, 13)).toEqual({
      value: "hello world",
      selectionStart: 6,
      selectionEnd: 11,
    });
  });

  it("inserts markers at the caret when there is no selection", () => {
    expect(toggleInlineBoldMarkdown("ab", 1, 1)).toEqual({
      value: "a****b",
      selectionStart: 3,
      selectionEnd: 3,
    });
  });
});

describe("parseInlineBoldSegments", () => {
  it("splits paired bold markers", () => {
    expect(parseInlineBoldSegments("见 **重点** 即可")).toEqual([
      { type: "text", value: "见 " },
      { type: "bold", value: "重点" },
      { type: "text", value: " 即可" },
    ]);
  });

  it("keeps unclosed markers as plain text", () => {
    expect(parseInlineBoldSegments("半截 **未闭合")).toEqual([
      { type: "text", value: "半截 **未闭合" },
    ]);
  });
});
