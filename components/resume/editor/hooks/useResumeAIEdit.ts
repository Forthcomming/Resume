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
  updateActiveEntryVersionContent,
  updateActiveSectionContent,
  type SectionId,
  type SectionSubVersionsStore,
} from "@/lib/resume/versions";
import type { EditTarget, PendingAIEdit } from "@/types/ai-edit";

type BulletAITarget = Extract<EditTarget, { scope: "bullet" }>;

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
  toggleBulletAI: (target: BulletAITarget) => void;
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
      let slice: unknown;
      if (target.scope === "bullet" && "entryId" in target) {
        const entry = store.entrySections[target.sectionId].entries[target.entryId];
        const version = entry?.versions.find((item) => item.id === target.entryVersionId);
        if (!entry || !version) return;
        slice = { entries: [{ ...entry.facts, ...version.content }] };
      } else {
        slice = getEditSlice(
          { ...composedContent, [sectionId]: getActiveSectionContent(store, sectionId) },
          target
        );
      }
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
    if (target.scope === "bullet" && "entryId" in target) {
      const suggestedEntry = (suggested as { entries?: unknown[] })?.entries?.[0];
      if (!suggestedEntry || typeof suggestedEntry !== "object") return;
      const row = suggestedEntry as Record<string, unknown>;
      const content = target.sectionId === "work"
        ? { title: String(row.title ?? ""), bullets: Array.isArray(row.bullets) ? row.bullets.map(String) : [] }
        : { role: String(row.role ?? ""), techStack: Array.isArray(row.techStack) ? row.techStack.map(String) : [], bullets: Array.isArray(row.bullets) ? row.bullets.map(String) : [] };
      updateStore((value) =>
        updateActiveEntryVersionContent(value, target.sectionId, target.entryId, content)
      );
      setPendingAIEdit(null);
      setBulletAIOpen(null);
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
    (target: BulletAITarget) => {
      const isSame = JSON.stringify(bulletAIOpen) === JSON.stringify(target);
      if (!isSame) setPendingAIEdit(null);
      setBulletAIOpen(isSame ? null : target);
      setAiOpenSections((previous) => ({ ...previous, [target.sectionId]: false }));
    },
    [bulletAIOpen]
  );
  const submitAIEdit = useCallback(
    (instruction: string) => {
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
    if (originalContent === undefined && target.scope === "bullet" && "entryId" in target) {
      const entry = store.entrySections[target.sectionId].entries[target.entryId];
      const version = entry?.versions.find((item) => item.id === target.entryVersionId);
      originalContent = entry && version ? { entries: [{ ...entry.facts, ...version.content }] } : "";
    } else if (originalContent === undefined) {
      originalContent = getEditSlice(
        { ...composedContent, [target.sectionId]: getActiveSectionContent(store, target.sectionId) },
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
