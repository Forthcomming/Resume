"use client";

import { useCallback, useMemo, useState } from "react";
import { applyAIEdit, getEditSlice, requestAIEdit } from "@/lib/ai/client-edit";
import {
  aiPromptPlaceholder,
  describeAIEditTarget,
} from "@/lib/ai/describe-target";
import { emptyResumeContent, type ResumeContent } from "@/lib/resume/content";
import {
  getActiveSectionContent,
  getSectionDisplayTitle,
  updateActiveSectionContent,
  type SectionId,
  type SectionSubVersionsStore,
} from "@/lib/resume/versions";
import type { EditTarget, PendingAIEdit } from "@/types/ai-edit";

type BulletAITarget = {
  sectionId: "work" | "project" | "education";
  entryIndex: number;
  bulletIndex: number;
};

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
  pendingAIEdit: PendingAIEdit | null;
  aiModalMeta: AIModalMeta | null;
  toggleSectionAI: (sectionId: SectionId) => void;
  toggleBulletAI: (
    sectionId: BulletAITarget["sectionId"],
    entryIndex: number,
    bulletIndex: number
  ) => void;
  runAIEdit: (target: EditTarget, instruction: string) => Promise<void>;
  submitAIEdit: (instruction: string) => void;
  acceptAIEdit: () => void;
  rejectAIEdit: () => void;
  closeAIEdit: () => void;
  optimizeSection: (sectionId: SectionId, instruction: string) => void;
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
  const [pendingAIEdit, setPendingAIEdit] = useState<PendingAIEdit | null>(null);

  const runAIEdit = useCallback(
    async (target: EditTarget, instruction: string) => {
      if (!store) return;
      const sectionId = target.sectionId;
      const slice = getEditSlice(
        {
          ...composedContent,
          [sectionId]: getActiveSectionContent(store, sectionId),
        },
        target
      );
      setPendingAIEdit({
        target,
        instruction,
        original: slice,
        suggested: null,
        status: "loading",
      });
      try {
        const result = await requestAIEdit(target, slice, instruction);
        setPendingAIEdit({
          target,
          instruction,
          original: result.original,
          suggested: result.suggested,
          status: "ready",
        });
      } catch (error) {
        setPendingAIEdit({
          target,
          instruction,
          original: slice,
          suggested: null,
          status: "error",
          error: error instanceof Error ? error.message : "AI 编辑失败",
        });
      }
    },
    [store, composedContent]
  );

  const acceptAIEdit = useCallback(() => {
    if (!pendingAIEdit || !store || pendingAIEdit.status !== "ready") return;
    const { target, suggested } = pendingAIEdit;
    const sectionId = target.sectionId;
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
  }, [pendingAIEdit, store, updateStore]);

  const rejectAIEdit = useCallback(() => setPendingAIEdit(null), []);
  const closeAIEdit = useCallback(() => {
    setPendingAIEdit(null);
    setAiOpenSections({});
    setBulletAIOpen(null);
  }, []);
  const toggleSectionAI = useCallback((sectionId: SectionId) => {
    setAiOpenSections((previous) => {
      const opening = !previous[sectionId];
      if (opening) {
        setBulletAIOpen(null);
        setPendingAIEdit(null);
      }
      return { ...previous, [sectionId]: opening };
    });
  }, []);
  const toggleBulletAI = useCallback(
    (
      sectionId: BulletAITarget["sectionId"],
      entryIndex: number,
      bulletIndex: number
    ) => {
      const isSame =
        bulletAIOpen?.sectionId === sectionId &&
        bulletAIOpen.entryIndex === entryIndex &&
        bulletAIOpen.bulletIndex === bulletIndex;
      if (!isSame) setPendingAIEdit(null);
      setBulletAIOpen(
        isSame ? null : { sectionId, entryIndex, bulletIndex }
      );
      setAiOpenSections((previous) => ({ ...previous, [sectionId]: false }));
    },
    [bulletAIOpen]
  );
  const submitAIEdit = useCallback(
    (instruction: string) => {
      if (bulletAIOpen) {
        void runAIEdit({ scope: "bullet", ...bulletAIOpen }, instruction);
        return;
      }
      const sectionId = Object.entries(aiOpenSections).find(
        ([, open]) => open
      )?.[0] as SectionId | undefined;
      if (sectionId) {
        void runAIEdit({ scope: "section", sectionId }, instruction);
      }
    },
    [bulletAIOpen, aiOpenSections, runAIEdit]
  );
  const optimizeSection = useCallback(
    (sectionId: SectionId, instruction: string) => {
      setBulletAIOpen(null);
      setAiOpenSections({ [sectionId]: true });
      void runAIEdit({ scope: "section", sectionId }, instruction);
    },
    [runAIEdit]
  );

  const aiModalMeta = useMemo<AIModalMeta | null>(() => {
    if (!store) return null;
    let target: EditTarget | null = null;
    if (pendingAIEdit) target = pendingAIEdit.target;
    else if (bulletAIOpen) target = { scope: "bullet", ...bulletAIOpen };
    else {
      const sectionId = Object.entries(aiOpenSections).find(
        ([, open]) => open
      )?.[0] as SectionId | undefined;
      if (sectionId) target = { scope: "section", sectionId };
    }
    if (!target) return null;

    const sectionTitle = getSectionDisplayTitle(store, target.sectionId);
    const { title, subtitle } = describeAIEditTarget(target, sectionTitle);
    const originalContent =
      pendingAIEdit?.original ??
      getEditSlice(
        {
          ...composedContent,
          [target.sectionId]: getActiveSectionContent(store, target.sectionId),
        },
        target
      );
    return {
      target,
      title,
      subtitle,
      placeholder: aiPromptPlaceholder(target, sectionTitle),
      originalContent,
    };
  }, [store, pendingAIEdit, bulletAIOpen, aiOpenSections, composedContent]);

  return {
    aiOpenSections,
    bulletAIOpen,
    pendingAIEdit,
    aiModalMeta,
    toggleSectionAI,
    toggleBulletAI,
    runAIEdit,
    submitAIEdit,
    acceptAIEdit,
    rejectAIEdit,
    closeAIEdit,
    optimizeSection,
  };
}
