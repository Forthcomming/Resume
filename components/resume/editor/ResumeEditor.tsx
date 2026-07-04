"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorTopBar, type SaveState } from "./EditorTopBar";
import { SectionEditorCard } from "./SectionEditorCard";
import { ResumePreview } from "./ResumePreview";
import { JDPanel } from "./JDPanel";
import { VersionPanel } from "./VersionPanel";
import { EDITOR_SECTIONS } from "./sections";
import { saveResumeContentAction } from "@/app/resume/[id]/actions";
import {
  emptyResumeContent,
  normalizeResumeContent,
  type ResumeContent,
} from "@/lib/resume/content";
import {
  resumeContentKey,
  saveLocalResumeContent,
  touchLocalResumeUpdated,
} from "@/lib/resume/local-storage";
import {
  addSectionSubVersion,
  composeFromSectionSubVersions,
  duplicateSectionSubVersion,
  getActiveSectionContent,
  getActiveSectionVersionId,
  getSectionVersions,
  initSectionSubVersionsStore,
  readSectionSubVersionsStore,
  renameSectionSubVersion,
  saveSectionSubVersionsStore,
  setActiveSectionVersion,
  updateActiveSectionContent,
  type SectionId,
  type SectionSubVersionsStore,
} from "@/lib/resume/versions";
import { applyAIEdit, getEditSlice, requestAIEdit } from "@/lib/ai/client-edit";
import type { EditTarget, PendingAIEdit } from "@/types/ai-edit";

interface ResumeEditorProps {
  id: string;
  title: string;
  initialContent: ResumeContent | null;
}

const storageKey = resumeContentKey;

export function ResumeEditor({ id, title, initialContent }: ResumeEditorProps) {
  const [store, setStore] = useState<SectionSubVersionsStore | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);
  const [aiOpenSections, setAiOpenSections] = useState<Record<string, boolean>>({});
  const [bulletAIOpen, setBulletAIOpen] = useState<{
    sectionId: string;
    entryIndex: number;
    bulletIndex: number;
  } | null>(null);
  const [pendingAIEdit, setPendingAIEdit] = useState<PendingAIEdit | null>(null);
  const skipNextSave = useRef(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let baseContent = initialContent ?? emptyResumeContent();
    if (!initialContent) {
      try {
        const raw = localStorage.getItem(storageKey(id));
        if (raw) baseContent = normalizeResumeContent(JSON.parse(raw));
      } catch {
        /* ignore malformed cache */
      }
    }

    const existing = readSectionSubVersionsStore(id);
    if (existing) {
      setStore(existing);
      return;
    }

    const next = initSectionSubVersionsStore(baseContent);
    setStore(next);
    saveSectionSubVersionsStore(id, next);
  }, [id, initialContent]);

  const composedContent = useMemo(
    () => (store ? composeFromSectionSubVersions(store) : emptyResumeContent()),
    [store]
  );

  useEffect(() => {
    if (!store) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    setSaveState("saving");
    const t = setTimeout(async () => {
      saveSectionSubVersionsStore(id, store);
      const res = await saveResumeContentAction(id, composedContent);
      if (!res.configured) {
        try {
          saveLocalResumeContent(id, composedContent);
          touchLocalResumeUpdated(id);
        } catch {
          /* ignore quota errors */
        }
      }
      setSaveState("saved");
    }, 800);
    return () => clearTimeout(t);
  }, [store, composedContent, id]);

  const updateStore = useCallback(
    (updater: (s: SectionSubVersionsStore) => SectionSubVersionsStore) => {
      setStore((prev) => (prev ? updater(prev) : prev));
    },
    []
  );

  const getSectionCardContent = useCallback(
    (sectionId: SectionId): ResumeContent => {
      if (!store) return emptyResumeContent();
      return {
        ...composedContent,
        [sectionId]: getActiveSectionContent(store, sectionId),
      };
    },
    [store, composedContent]
  );

  const handleSectionChange = useCallback(
    (sectionId: SectionId, next: ResumeContent) => {
      updateStore((s) =>
        updateActiveSectionContent(s, sectionId, next[sectionId])
      );
    },
    [updateStore]
  );

  const handleActiveVersionChange = useCallback(
    (sectionId: SectionId, versionId: string) => {
      updateStore((s) => setActiveSectionVersion(s, sectionId, versionId));
    },
    [updateStore]
  );

  const handleCreateSubVersion = useCallback(
    (sectionId: SectionId, name: string) => {
      updateStore((s) =>
        addSectionSubVersion(s, sectionId, name, { activate: true })
      );
    },
    [updateStore]
  );

  const handleRenameSubVersion = useCallback(
    (sectionId: SectionId, versionId: string, name: string) => {
      updateStore((s) => renameSectionSubVersion(s, sectionId, versionId, name));
    },
    [updateStore]
  );

  const handleDuplicateSubVersion = useCallback(
    (sectionId: SectionId, versionId: string) => {
      updateStore((s) => duplicateSectionSubVersion(s, sectionId, versionId));
    },
    [updateStore]
  );

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
      } catch (err) {
        setPendingAIEdit({
          target,
          instruction,
          original: slice,
          suggested: null,
          status: "error",
          error: err instanceof Error ? err.message : "AI 编辑失败",
        });
      }
    },
    [store, composedContent]
  );

  const handleAIAccept = useCallback(() => {
    if (!pendingAIEdit || !store || pendingAIEdit.status !== "ready") return;

    const { target, suggested } = pendingAIEdit;
    const sectionId = target.sectionId;
    const currentSection = {
      ...emptyResumeContent(),
      [sectionId]: getActiveSectionContent(store, sectionId),
    };
    const updated = applyAIEdit(currentSection, target, suggested);

    updateStore((s) =>
      updateActiveSectionContent(s, sectionId, updated[sectionId])
    );

    setPendingAIEdit(null);
    setAiOpenSections({});
    setBulletAIOpen(null);
  }, [pendingAIEdit, store, updateStore]);

  const handleAIReject = useCallback(() => {
    setPendingAIEdit(null);
  }, []);

  const handleSectionAIRequest = useCallback(
    (sectionId: SectionId, instruction: string) => {
      runAIEdit({ scope: "section", sectionId }, instruction);
    },
    [runAIEdit]
  );

  const handleBulletAIRequest = useCallback(
    (
      sectionId: "work" | "project" | "education",
      entryIndex: number,
      bulletIndex: number,
      instruction: string
    ) => {
      runAIEdit({ scope: "bullet", sectionId, entryIndex, bulletIndex }, instruction);
    },
    [runAIEdit]
  );

  const handleExportPdf = useCallback(() => {
    window.print();
  }, []);

  if (!store) {
    return (
      <div className="flex h-screen items-center justify-center bg-fog text-ink-muted">
        加载中...
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-fog">
      <EditorTopBar title={title} saveState={saveState} onExportPdf={handleExportPdf} />

      <div className="flex min-h-0 flex-1">
        <div className="no-print flex w-1/2 min-w-0 flex-col border-r border-ink-soft/10">
          <div className="min-h-0 flex-1 space-y-3 overflow-auto bg-fog/40 p-4">
            {EDITOR_SECTIONS.map((section) => {
              const sectionId = section.id as SectionId;
              const bulletOpenForSection =
                bulletAIOpen?.sectionId === section.id ? bulletAIOpen : null;

              return (
                <SectionEditorCard
                  key={section.id}
                  section={section}
                  content={getSectionCardContent(sectionId)}
                  onChange={(next) => handleSectionChange(sectionId, next)}
                  versions={getSectionVersions(store, sectionId)}
                  activeVersionId={getActiveSectionVersionId(store, sectionId)}
                  onActiveVersionChange={(vid) =>
                    handleActiveVersionChange(sectionId, vid)
                  }
                  onCreateSubVersion={(name) =>
                    handleCreateSubVersion(sectionId, name)
                  }
                  onRenameSubVersion={(vid, name) =>
                    handleRenameSubVersion(sectionId, vid, name)
                  }
                  onDuplicateSubVersion={(vid) =>
                    handleDuplicateSubVersion(sectionId, vid)
                  }
                  aiOpen={!!aiOpenSections[section.id]}
                  onToggleAI={() =>
                    setAiOpenSections((prev) => ({
                      ...prev,
                      [section.id]: !prev[section.id],
                    }))
                  }
                  pendingAIEdit={pendingAIEdit}
                  onAIRequest={(instruction) =>
                    handleSectionAIRequest(sectionId, instruction)
                  }
                  onAIAccept={handleAIAccept}
                  onAIReject={handleAIReject}
                  onBulletAIRequest={
                    sectionId === "work" ||
                    sectionId === "project" ||
                    sectionId === "education"
                      ? (entryIndex, bulletIndex, instruction) =>
                          handleBulletAIRequest(
                            sectionId,
                            entryIndex,
                            bulletIndex,
                            instruction
                          )
                      : undefined
                  }
                  bulletAIOpen={
                    bulletOpenForSection
                      ? {
                          entryIndex: bulletOpenForSection.entryIndex,
                          bulletIndex: bulletOpenForSection.bulletIndex,
                        }
                      : null
                  }
                  onToggleBulletAI={(entryIndex, bulletIndex) => {
                    const isSame =
                      bulletAIOpen?.sectionId === section.id &&
                      bulletAIOpen.entryIndex === entryIndex &&
                      bulletAIOpen.bulletIndex === bulletIndex;
                    setBulletAIOpen(
                      isSame
                        ? null
                        : { sectionId: section.id, entryIndex, bulletIndex }
                    );
                    setAiOpenSections((prev) => ({
                      ...prev,
                      [section.id]: false,
                    }));
                  }}
                />
              );
            })}
          </div>

          <VersionPanel
            open={versionPanelOpen}
            onToggle={() => setVersionPanelOpen((o) => !o)}
            store={store}
          />
          <JDPanel />
        </div>

        <div className="w-1/2 min-w-0 overflow-auto bg-fog px-6">
          <ResumePreview title={title} content={composedContent} />
        </div>
      </div>
    </div>
  );
}
