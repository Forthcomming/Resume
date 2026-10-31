"use client";

import { useCallback, useMemo, useState } from "react";
import {
  applyAIEdit,
  getEditSlice,
  requestAdaptiveAIEdit,
} from "@/lib/ai/client-edit";
import {
  aiPromptPlaceholder,
  describeAIEditTarget,
} from "@/lib/ai/describe-target";
import { emptyResumeContent, type ResumeContent } from "@/lib/resume/content";
import {
  getActiveSectionContent,
  getSectionDisplayTitle,
  updateActiveEntryVersionContent,
  updateActiveSectionContent,
  type ProjectEntryVariant,
  type SectionId,
  type SectionSubVersionsStore,
  type WorkEntryVariant,
} from "@/lib/resume/versions";
import type {
  AIEditAnswers,
  EditTarget,
  PendingAIEdit,
} from "@/types/ai-edit";

type BulletAITarget = Extract<EditTarget, { scope: "bullet" }>;
type SummaryAITarget = Extract<EditTarget, { scope: "summary" }>;

interface UseResumeAIEditOptions {
  store: SectionSubVersionsStore | null;
  composedContent: ResumeContent;
  updateStore: (
    updater: (store: SectionSubVersionsStore) => SectionSubVersionsStore
  ) => void;
}

interface AIModalMeta {
  target: EditTarget;
  title: string;
  subtitle?: string;
  placeholder: string;
  originalContent: unknown;
}

export interface UseResumeAIEditResult {
  aiOpenSections: Record<string, boolean>;
  bulletAIOpen: BulletAITarget | null;
  summaryAIOpen: SummaryAITarget | null;
  pendingAIEdit: PendingAIEdit | null;
  aiModalMeta: AIModalMeta | null;
  toggleSectionAI: (sectionId: SectionId) => void;
  toggleBulletAI: (target: BulletAITarget) => void;
  toggleSummaryAI: (target: SummaryAITarget) => void;
  runAIEdit: (target: EditTarget, instruction: string) => Promise<void>;
  submitAIEdit: (instruction: string) => void;
  submitAIClarification: (answers: AIEditAnswers) => void;
  submitConservativeAIEdit: () => void;
  acceptAIEdit: () => void;
  rejectAIEdit: () => void;
  closeAIEdit: () => void;
  optimizeSection: (sectionId: SectionId, instruction: string) => void;
}

function isEntryScopedTarget(
  target: EditTarget
): target is
  | Extract<EditTarget, { scope: "bullet"; entryId: string }>
  | SummaryAITarget {
  return (
    (target.scope === "bullet" || target.scope === "summary") &&
    "entryId" in target
  );
}

export function useResumeAIEdit({
  store,
  composedContent,
  updateStore,
}: UseResumeAIEditOptions): UseResumeAIEditResult {
  const [aiOpenSections, setAiOpenSections] = useState<Record<string, boolean>>(
    {}
  );
  const [bulletAIOpen, setBulletAIOpen] = useState<BulletAITarget | null>(null);
  const [summaryAIOpen, setSummaryAIOpen] = useState<SummaryAITarget | null>(
    null
  );
  const [pendingAIEdit, setPendingAIEdit] = useState<PendingAIEdit | null>(null);

  const resolveSlice = useCallback(
    (target: EditTarget): unknown | null => {
      if (!store) return null;
      const sectionId = target.sectionId;
      if (isEntryScopedTarget(target)) {
        const entry =
          store.entrySections[target.sectionId].entries[target.entryId];
        const version = entry?.versions.find(
          (item) => item.id === target.entryVersionId
        );
        if (!entry || !version) return null;
        return { entries: [{ ...entry.facts, ...version.content }] };
      }
      return getEditSlice(
        {
          ...composedContent,
          [sectionId]: getActiveSectionContent(store, sectionId),
        },
        target
      );
    },
    [store, composedContent]
  );

  const runAIEdit = useCallback(
    async (target: EditTarget, instruction: string) => {
      if (!store) return;
      const slice = resolveSlice(target);
      if (slice === null) return;

      setPendingAIEdit({
        status: "analyzing",
        target,
        instruction,
        original: slice,
      });

      try {
        const result = await requestAdaptiveAIEdit(target, slice, instruction);
        if (result.status === "needs_input") {
          setPendingAIEdit({
            target,
            instruction,
            ...result,
          });
          return;
        }
        setPendingAIEdit({
          target,
          instruction,
          ...result,
        });
      } catch (error) {
        setPendingAIEdit({
          status: "error",
          target,
          instruction,
          original: slice,
          error: error instanceof Error ? error.message : "AI 编辑失败",
        });
      }
    },
    [store, resolveSlice]
  );

  const generateAfterClarification = useCallback(
    async (options: {
      answers?: AIEditAnswers;
      conservative?: boolean;
    }) => {
      if (!pendingAIEdit || pendingAIEdit.status !== "needs_input") return;
      const { target, instruction, original } = pendingAIEdit;
      setPendingAIEdit({
        status: "generating",
        target,
        instruction,
        original,
      });
      try {
        const result = await requestAdaptiveAIEdit(
          target,
          original,
          instruction,
          options
        );
        if (result.status !== "ready") {
          throw new Error("补充信息后仍未生成有效建议");
        }
        setPendingAIEdit({
          target,
          instruction,
          ...result,
        });
      } catch (error) {
        setPendingAIEdit({
          status: "error",
          target,
          instruction,
          original,
          error: error instanceof Error ? error.message : "AI 编辑失败",
        });
      }
    },
    [pendingAIEdit]
  );

  const submitAIClarification = useCallback(
    (answers: AIEditAnswers) => {
      void generateAfterClarification({ answers });
    },
    [generateAfterClarification]
  );

  const submitConservativeAIEdit = useCallback(() => {
    void generateAfterClarification({ conservative: true });
  }, [generateAfterClarification]);

  const acceptAIEdit = useCallback(() => {
    if (!pendingAIEdit || !store || pendingAIEdit.status !== "ready") return;
    const { target, suggested } = pendingAIEdit;
    const sectionId = target.sectionId;
    if (isEntryScopedTarget(target)) {
      const suggestedEntry = (suggested as { entries?: unknown[] })?.entries?.[0];
      if (!suggestedEntry || typeof suggestedEntry !== "object") return;
      const row = suggestedEntry as Record<string, unknown>;
      const entry =
        store.entrySections[target.sectionId].entries[target.entryId];
      const version =
        entry?.versions.find((item) => item.id === target.entryVersionId) ??
        entry?.versions.find((item) => item.id === entry.activeVersionId);
      if (!version) return;

      if (target.scope === "summary") {
        const current = version.content as WorkEntryVariant | ProjectEntryVariant;
        updateStore((value) =>
          updateActiveEntryVersionContent(value, target.sectionId, target.entryId, {
            ...current,
            summary: String(row.summary ?? ""),
          })
        );
        setPendingAIEdit(null);
        setSummaryAIOpen(null);
        setBulletAIOpen(null);
        return;
      }

      const currentSummary = String(
        (version.content as { summary?: string }).summary ?? ""
      );
      const content =
        target.sectionId === "work"
          ? {
              title: String(row.title ?? ""),
              summary: String(row.summary ?? currentSummary),
              bullets: Array.isArray(row.bullets)
                ? row.bullets.map(String)
                : [],
            }
          : {
              role: String(row.role ?? ""),
              techStack: Array.isArray(row.techStack)
                ? row.techStack.map(String)
                : [],
              summary: String(row.summary ?? currentSummary),
              bullets: Array.isArray(row.bullets)
                ? row.bullets.map(String)
                : [],
            };
      updateStore((value) =>
        updateActiveEntryVersionContent(
          value,
          target.sectionId,
          target.entryId,
          content
        )
      );
      setPendingAIEdit(null);
      setBulletAIOpen(null);
      setSummaryAIOpen(null);
      return;
    }
    const currentSection = {
      ...emptyResumeContent(),
      [sectionId]: getActiveSectionContent(store, sectionId),
    };
    const updated = applyAIEdit(currentSection, target, suggested);
    updateStore((value) =>
      updateActiveSectionContent(value, sectionId, updated[sectionId])
    );
    setPendingAIEdit(null);
    setAiOpenSections({});
    setBulletAIOpen(null);
    setSummaryAIOpen(null);
  }, [pendingAIEdit, store, updateStore]);

  const rejectAIEdit = useCallback(() => setPendingAIEdit(null), []);
  const closeAIEdit = useCallback(() => {
    setPendingAIEdit(null);
    setAiOpenSections({});
    setBulletAIOpen(null);
    setSummaryAIOpen(null);
  }, []);
  const toggleSectionAI = useCallback((sectionId: SectionId) => {
    setAiOpenSections((previous) => {
      const opening = !previous[sectionId];
      if (opening) {
        setBulletAIOpen(null);
        setSummaryAIOpen(null);
        setPendingAIEdit(null);
      }
      return { ...previous, [sectionId]: opening };
    });
  }, []);
  const toggleBulletAI = useCallback(
    (target: BulletAITarget) => {
      const isSame = JSON.stringify(bulletAIOpen) === JSON.stringify(target);
      if (!isSame) setPendingAIEdit(null);
      setBulletAIOpen(isSame ? null : target);
      setSummaryAIOpen(null);
      setAiOpenSections((previous) => ({
        ...previous,
        [target.sectionId]: false,
      }));
    },
    [bulletAIOpen]
  );
  const toggleSummaryAI = useCallback(
    (target: SummaryAITarget) => {
      const isSame = JSON.stringify(summaryAIOpen) === JSON.stringify(target);
      if (!isSame) setPendingAIEdit(null);
      setSummaryAIOpen(isSame ? null : target);
      setBulletAIOpen(null);
      setAiOpenSections((previous) => ({
        ...previous,
        [target.sectionId]: false,
      }));
    },
    [summaryAIOpen]
  );
  const submitAIEdit = useCallback(
    (instruction: string) => {
      if (summaryAIOpen) {
        void runAIEdit(summaryAIOpen, instruction);
        return;
      }
      if (bulletAIOpen) {
        void runAIEdit(bulletAIOpen, instruction);
        return;
      }
      const sectionId = Object.entries(aiOpenSections).find(
        ([, open]) => open
      )?.[0] as SectionId | undefined;
      if (sectionId) {
        void runAIEdit({ scope: "section", sectionId }, instruction);
      }
    },
    [summaryAIOpen, bulletAIOpen, aiOpenSections, runAIEdit]
  );
  const optimizeSection = useCallback(
    (sectionId: SectionId, instruction: string) => {
      setBulletAIOpen(null);
      setSummaryAIOpen(null);
      setAiOpenSections({ [sectionId]: true });
      void runAIEdit({ scope: "section", sectionId }, instruction);
    },
    [runAIEdit]
  );

  const aiModalMeta = useMemo<AIModalMeta | null>(() => {
    if (!store) return null;
    let target: EditTarget | null = null;
    if (pendingAIEdit) target = pendingAIEdit.target;
    else if (summaryAIOpen) target = summaryAIOpen;
    else if (bulletAIOpen) target = bulletAIOpen;
    else {
      const sectionId = Object.entries(aiOpenSections).find(
        ([, open]) => open
      )?.[0] as SectionId | undefined;
      if (sectionId) target = { scope: "section", sectionId };
    }
    if (!target) return null;

    const sectionTitle = getSectionDisplayTitle(store, target.sectionId);
    const { title, subtitle } = describeAIEditTarget(target, sectionTitle);
    let originalContent = pendingAIEdit?.original;
    if (
      originalContent === undefined &&
      isEntryScopedTarget(target)
    ) {
      const entry =
        store.entrySections[target.sectionId].entries[target.entryId];
      const version = entry?.versions.find(
        (item) => item.id === target.entryVersionId
      );
      originalContent =
        entry && version
          ? { entries: [{ ...entry.facts, ...version.content }] }
          : "";
    } else if (originalContent === undefined) {
      originalContent = getEditSlice(
        {
          ...composedContent,
          [target.sectionId]: getActiveSectionContent(store, target.sectionId),
        },
        target
      );
    }
    return {
      target,
      title,
      subtitle,
      placeholder: aiPromptPlaceholder(target, sectionTitle),
      originalContent,
    };
  }, [
    store,
    pendingAIEdit,
    summaryAIOpen,
    bulletAIOpen,
    aiOpenSections,
    composedContent,
  ]);

  return {
    aiOpenSections,
    bulletAIOpen,
    summaryAIOpen,
    pendingAIEdit,
    aiModalMeta,
    toggleSectionAI,
    toggleBulletAI,
    toggleSummaryAI,
    runAIEdit,
    submitAIEdit,
    submitAIClarification,
    submitConservativeAIEdit,
    acceptAIEdit,
    rejectAIEdit,
    closeAIEdit,
    optimizeSection,
  };
}
