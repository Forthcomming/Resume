"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorTopBar, type SaveState } from "./EditorTopBar";
import { SectionEditorCard } from "./SectionEditorCard";
import { ResumePreview } from "./ResumePreview";
import { JDPanel } from "./JDPanel";
import { getEditorSectionsInOrder } from "./sections";
import { saveResumeContentAction, updateResumeTitleAction } from "@/app/resume/[id]/actions";
import {
  emptyResumeContent,
  normalizeResumeContent,
  type ResumeContent,
} from "@/lib/resume/content";
import {
  resumeContentKey,
  saveLocalResumeContent,
  touchLocalResumeUpdated,
  upsertLocalResume,
} from "@/lib/resume/local-storage";
import {
  composeFromSectionSubVersions,
  addSectionSubVersion,
  duplicateSectionSubVersion,
  deleteSectionSubVersion,
  getActiveSectionContent,
  getActiveSectionVersionId,
  getSectionOrder,
  getSectionVersions,
  getSectionDisplayTitle,
  setSectionDisplayTitle,
  getDateDisplayFormat,
  setDateDisplayFormat,
  DEFAULT_SECTION_LABELS,
  initSectionSubVersionsStore,
  readSectionSubVersionsStore,
  renameSectionSubVersion,
  reorderSections,
  saveSectionSubVersionsStore,
  setActiveSectionVersion,
  updateActiveSectionContent,
  type SectionId,
  type SectionSubVersionsStore,
} from "@/lib/resume/versions";
import { applyAIEdit, getEditSlice, requestAIEdit } from "@/lib/ai/client-edit";
import {
  aiPromptPlaceholder,
  describeAIEditTarget,
} from "@/lib/ai/describe-target";
import type { EditTarget, PendingAIEdit } from "@/types/ai-edit";
import type { DateDisplayFormat } from "@/lib/resume/date-display";
import { AIModal } from "./AIModal";

interface ResumeEditorProps {
  id: string;
  title: string;
  initialContent: ResumeContent | null;
}

const storageKey = resumeContentKey;

export function ResumeEditor({ id, title, initialContent }: ResumeEditorProps) {
  const [store, setStore] = useState<SectionSubVersionsStore | null>(null);
  const [resumeTitle, setResumeTitle] = useState(title);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [aiOpenSections, setAiOpenSections] = useState<Record<string, boolean>>({});
  const [bulletAIOpen, setBulletAIOpen] = useState<{
    sectionId: "work" | "project" | "education";
    entryIndex: number;
    bulletIndex: number;
  } | null>(null);
  const [pendingAIEdit, setPendingAIEdit] = useState<PendingAIEdit | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const skipNextSave = useRef(true);
  const initialized = useRef(false);

  useEffect(() => {
    setResumeTitle(title);
  }, [title]);

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

  const sectionOrder = useMemo(
    () => (store ? getSectionOrder(store) : []),
    [store]
  );

  const orderedSections = useMemo(
    () => getEditorSectionsInOrder(sectionOrder),
    [sectionOrder]
  );

  const dateDisplayFormat: DateDisplayFormat = store
    ? getDateDisplayFormat(store)
    : "YYYY-MM";

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

  const handleDateDisplayFormatChange = useCallback(
    (format: DateDisplayFormat) => {
      updateStore((s) => setDateDisplayFormat(s, format));
    },
    [updateStore]
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
      updateStore((s) => addSectionSubVersion(s, sectionId, name));
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

  const handleDeleteSubVersion = useCallback(
    (sectionId: SectionId, versionId: string) => {
      updateStore((s) => deleteSectionSubVersion(s, sectionId, versionId));
    },
    [updateStore]
  );

  const handleReorder = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId || fromId === "basic_info" || toId === "basic_info") {
        return;
      }
      updateStore((s) => {
        const order = getSectionOrder(s);
        const fromIndex = order.indexOf(fromId as SectionId);
        const toIndex = order.indexOf(toId as SectionId);
        if (fromIndex < 0 || toIndex < 0) return s;
        return reorderSections(s, fromIndex, toIndex);
      });
    },
    [updateStore]
  );

  const handleSectionTitleChange = useCallback(
    (sectionId: SectionId, title: string) => {
      updateStore((s) => setSectionDisplayTitle(s, sectionId, title));
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

  const handleAIModalClose = useCallback(() => {
    setPendingAIEdit(null);
    setAiOpenSections({});
    setBulletAIOpen(null);
  }, []);

  const aiModalMeta = useMemo(() => {
    if (!store) return null;

    let target: EditTarget | null = null;

    if (pendingAIEdit) {
      target = pendingAIEdit.target;
    } else if (bulletAIOpen) {
      target = {
        scope: "bullet",
        sectionId: bulletAIOpen.sectionId,
        entryIndex: bulletAIOpen.entryIndex,
        bulletIndex: bulletAIOpen.bulletIndex,
      };
    } else {
      const openSectionId = Object.entries(aiOpenSections).find(
        ([, open]) => open
      )?.[0] as SectionId | undefined;
      if (openSectionId) {
        target = { scope: "section", sectionId: openSectionId };
      }
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

  const handleAIModalSubmit = useCallback(
    (instruction: string) => {
      if (bulletAIOpen) {
        handleBulletAIRequest(
          bulletAIOpen.sectionId,
          bulletAIOpen.entryIndex,
          bulletAIOpen.bulletIndex,
          instruction
        );
        return;
      }
      const openSectionId = Object.entries(aiOpenSections).find(
        ([, open]) => open
      )?.[0] as SectionId | undefined;
      if (openSectionId) {
        handleSectionAIRequest(openSectionId, instruction);
      }
    },
    [bulletAIOpen, aiOpenSections, handleBulletAIRequest, handleSectionAIRequest]
  );

  const handleExportPdf = useCallback(() => {
    window.print();
  }, []);

  const handleResumeTitleChange = useCallback(
    async (nextTitle: string) => {
      setResumeTitle(nextTitle);
      try {
        upsertLocalResume({ id, title: nextTitle });
      } catch {
        /* ignore quota errors */
      }
      const res = await updateResumeTitleAction(id, nextTitle);
      if (!res.configured) {
        try {
          touchLocalResumeUpdated(id);
        } catch {
          /* ignore */
        }
      }
    },
    [id]
  );

  if (!store) {
    return (
      <div className="flex h-screen items-center justify-center bg-[radial-gradient(ellipse_at_50%_20%,#eef3fa_0%,#e8eef5_45%,#dce6f2_100%)] text-ink-muted">
        加载中...
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[radial-gradient(ellipse_at_50%_12%,#eef3fa_0%,#e8eef5_42%,#d8e4f0_100%)]">
      <EditorTopBar
        title={resumeTitle}
        saveState={saveState}
        onTitleChange={handleResumeTitleChange}
        onExportPdf={handleExportPdf}
      />

      <div className="flex min-h-0 flex-1">
        <div className="no-print flex w-1/2 min-w-0 flex-col border-r border-white/50 bg-white/25 backdrop-blur-[2px]">
          <div className="min-h-0 flex-1 space-y-4 overflow-auto p-5">
            {orderedSections.map((section) => {
              const sectionId = section.id as SectionId;
              const bulletOpenForSection =
                bulletAIOpen?.sectionId === section.id ? bulletAIOpen : null;
              const reorderable = sectionId !== "basic_info";

              return (
                <SectionEditorCard
                  key={section.id}
                  section={section}
                  displayTitle={getSectionDisplayTitle(store, sectionId)}
                  defaultTitle={DEFAULT_SECTION_LABELS[sectionId]}
                  onTitleChange={(t) => handleSectionTitleChange(sectionId, t)}
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
                  onDeleteSubVersion={(vid) =>
                    handleDeleteSubVersion(sectionId, vid)
                  }
                  aiOpen={!!aiOpenSections[section.id]}
                  onToggleAI={() =>
                    setAiOpenSections((prev) => {
                      const opening = !prev[section.id];
                      if (opening) {
                        setBulletAIOpen(null);
                        setPendingAIEdit(null);
                      }
                      return { ...prev, [section.id]: opening };
                    })
                  }
                  pendingAIEdit={pendingAIEdit}
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
                    if (!isSame) {
                      setPendingAIEdit(null);
                    }
                    setBulletAIOpen(
                      isSame
                        ? null
                        : {
                            sectionId: sectionId as "work" | "project" | "education",
                            entryIndex,
                            bulletIndex,
                          }
                    );
                    setAiOpenSections((prev) => ({
                      ...prev,
                      [section.id]: false,
                    }));
                  }}
                  dateDisplayFormat={dateDisplayFormat}
                  onDateDisplayFormatChange={handleDateDisplayFormatChange}
                  reorderable={reorderable}
                  isDragging={draggingId === section.id}
                  isDragOver={dragOverId === section.id && draggingId !== section.id}
                  onDragStart={(event) => {
                    setDraggingId(section.id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", section.id);
                  }}
                  onDragOver={(event) => {
                    if (!reorderable || !draggingId || draggingId === section.id) {
                      return;
                    }
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverId(section.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const fromId =
                      event.dataTransfer.getData("text/plain") || draggingId;
                    if (fromId) handleReorder(fromId, section.id);
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                />
              );
            })}
          </div>

          <JDPanel />
        </div>

        <div className="w-1/2 min-w-0 overflow-auto px-8 py-2">
          <ResumePreview
            title={resumeTitle}
            content={composedContent}
            sectionOrder={sectionOrder}
            sectionTitles={store.sectionTitles}
            dateDisplayFormat={dateDisplayFormat}
          />
        </div>
      </div>

      <AIModal
        open={aiModalMeta !== null}
        title={aiModalMeta?.title ?? "AI 优化"}
        subtitle={aiModalMeta?.subtitle}
        promptPlaceholder={aiModalMeta?.placeholder}
        target={aiModalMeta?.target ?? { scope: "section", sectionId: "summary" }}
        originalContent={aiModalMeta?.originalContent ?? ""}
        pendingAIEdit={pendingAIEdit}
        onClose={handleAIModalClose}
        onSubmit={handleAIModalSubmit}
        onAccept={handleAIAccept}
        onRetry={handleAIReject}
        onDismissSuggestion={handleAIModalClose}
      />
    </div>
  );
}
