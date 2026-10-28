"use client";

import { useMemo, useState } from "react";
import type {
  AIEditAnswers,
  AIEditClarificationQuestion,
} from "@/types/ai-edit";

interface AIClarificationFormProps {
  diagnosis: string;
  questions: AIEditClarificationQuestion[];
  onSubmit: (answers: AIEditAnswers) => void;
  onConservative: () => void;
}

export function AIClarificationForm({
  diagnosis,
  questions,
  onSubmit,
  onConservative,
}: AIClarificationFormProps) {
  const [answers, setAnswers] = useState<AIEditAnswers>(() =>
    Object.fromEntries(questions.map((item) => [item.id, ""]))
  );

  const canSubmit = useMemo(
    () => Object.values(answers).some((value) => value.trim().length > 0),
    [answers]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-3">
        <p className="text-[12px] font-medium text-amber-900">需要补充关键事实</p>
        <p className="mt-1 text-[12px] leading-relaxed text-amber-800/90">
          {diagnosis}
        </p>
      </div>

      <div className="space-y-3">
        {questions.map((item, index) => (
          <label key={item.id} className="block space-y-1.5">
            <span className="text-[12px] font-medium text-ink">
              {index + 1}. {item.question}
            </span>
            <textarea
              rows={2}
              value={answers[item.id] ?? ""}
              onChange={(event) =>
                setAnswers((previous) => ({
                  ...previous,
                  [item.id]: event.target.value,
                }))
              }
              placeholder={item.placeholder ?? "例如：完成了什么、覆盖了多少、结果如何"}
              className="glass-control w-full resize-none rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink-muted focus:border-ink-soft/20 focus:bg-white focus:ring-2 focus:ring-ink/5"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const cleaned = Object.fromEntries(
              Object.entries(answers)
                .map(([id, value]) => [id, value.trim()] as const)
                .filter(([, value]) => value.length > 0)
            );
            if (!Object.keys(cleaned).length) return;
            onSubmit(cleaned);
          }}
          disabled={!canSubmit}
          className="rounded-full bg-ink px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#1A2D40] disabled:opacity-50"
        >
          根据补充信息生成
        </button>
        <button
          type="button"
          onClick={onConservative}
          className="rounded-full border border-ink-soft/15 bg-white px-3.5 py-2 text-[12px] text-ink-soft transition-colors hover:border-ink-soft/25 hover:text-ink"
        >
          暂不补充，保守优化
        </button>
      </div>
    </div>
  );
}
