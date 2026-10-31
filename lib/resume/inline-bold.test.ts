import { describe, expect, it } from "vitest";
import {
  editableHtmlToMarkdown,
  markdownToEditableHtml,
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

describe("wysiwyg html round-trip", () => {
  it("converts markdown to editable html", () => {
    expect(markdownToEditableHtml("见 **重点**")).toBe(
      "见 <strong>重点</strong>"
    );
  });

  it("converts editable html back to markdown", () => {
    expect(
      editableHtmlToMarkdown("见 <strong>重点</strong><br>第二行")
    ).toBe("见 **重点**\n第二行");
  });

  it("round-trips multiline bold markdown", () => {
    const md = "**产品热情**：快速学习\n**用户体验**：打磨细节";
    expect(editableHtmlToMarkdown(markdownToEditableHtml(md))).toBe(md);
  });

  it("keeps a single trailing newline from Enter", () => {
    expect(editableHtmlToMarkdown("第一行<br>")).toBe("第一行\n");
    expect(editableHtmlToMarkdown("第一行<div><br></div>")).toBe("第一行\n");
  });
});
