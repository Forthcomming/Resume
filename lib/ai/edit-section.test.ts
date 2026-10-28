import { describe, expect, it } from "vitest";
import { sanitizeAdaptiveEditResult } from "@/lib/ai/edit-section";

const original = {
  entries: [
    {
      company: "示例公司",
      title: "产品经理",
      bullets: ["负责产品设计"],
    },
  ],
};

describe("sanitizeAdaptiveEditResult", () => {
  it("limits clarification questions and rebuilds stable ids", () => {
    expect(
      sanitizeAdaptiveEditResult(
        {
          status: "needs_input",
          diagnosis: "缺少结果依据",
          questions: [
            { question: "最终产生了什么结果？" },
            { question: "你采取了什么具体动作？" },
            { question: "你本人负责哪部分？" },
            { question: "多余问题" },
          ],
        },
        original,
        false
      )
    ).toMatchObject({
      status: "needs_input",
      original,
      diagnosis: "缺少结果依据",
      questions: [
        { id: "question-1", question: "最终产生了什么结果？" },
        { id: "question-2", question: "你采取了什么具体动作？" },
        { id: "question-3", question: "你本人负责哪部分？" },
      ],
    });
  });

  it("filters empty questions and caps improvements", () => {
    const suggested = {
      entries: [
        {
          company: "示例公司",
          title: "产品经理",
          bullets: ["梳理需求并推动设计落地"],
        },
      ],
    };

    expect(
      sanitizeAdaptiveEditResult(
        {
          status: "ready",
          suggested,
          improvements: [
            "补上具体动作",
            "",
            "突出落地结果",
            "额外说明",
            "再多余一条",
          ],
        },
        original,
        false
      )
    ).toEqual({
      status: "ready",
      original,
      suggested,
      improvements: ["补上具体动作", "突出落地结果", "额外说明"],
    });
  });

  it("rejects follow-up responses that ask again", () => {
    expect(() =>
      sanitizeAdaptiveEditResult(
        { status: "needs_input", diagnosis: "仍需信息", questions: [] },
        original,
        true
      )
    ).toThrow("补充信息后仍未生成有效建议");
  });

  it("rejects an unchanged suggestion", () => {
    expect(() =>
      sanitizeAdaptiveEditResult(
        { status: "ready", suggested: original, improvements: ["调整表达"] },
        original,
        false
      )
    ).toThrow("AI 建议与原文没有实质差异");
  });

  it("rejects ready results without a suggested payload", () => {
    expect(() =>
      sanitizeAdaptiveEditResult(
        { status: "ready", improvements: ["调整表达"] },
        original,
        false
      )
    ).toThrow("AI 未返回有效建议");
  });

  it("rejects incompatible top-level structure", () => {
    expect(() =>
      sanitizeAdaptiveEditResult(
        {
          status: "ready",
          suggested: { text: "不是 entries 结构" },
          improvements: ["结构调整"],
        },
        original,
        false
      )
    ).toThrow("AI 建议结构与原文不兼容");
  });
});
