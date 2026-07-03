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
  addVersion,
  composeContent,
  duplicateVersion,
  initVersionStore,
  readVersionStore,
  renameVersion,
  saveVersionStore,
  setSectionSource,
  updateVersionSection,
  type SectionId,
  type VersionStore,
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
  const [versionStore, setVersionStore] = useState<VersionStore | null>(null);
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

    const existing = readVersionStore(id);
    if (existing) {
      setVersionStore(existing);
      return;
    }

    const store = initVersionStore(baseContent);
    setVersionStore(store);
    saveVersionStore(id, store);
  }, [id, initialContent]);

  const composedContent = useMemo(
    () => (versionStore ? composeContent(versionStore) : emptyResumeContent()),
    [versionStore]
  );

  useEffect(() => {
    if (!versionStore) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    setSaveState("saving");
    const t = setTimeout(async () => {
      saveVersionStore(id, versionStore);
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
  }, [versionStore, composedContent, id]);

  const updateStore = useCallback((updater: (s: VersionStore) => VersionStore) => {
    setVersionStore((prev) => (prev ? updater(prev) : prev));
  }, []);

  const getSectionContent = useCallback(
    (sectionId: SectionId): ResumeContent[SectionId] => {
      if (!versionStore) return emptyResumeContent()[sectionId];
      const versionId = versionStore.compose[sectionId];
      const version = versionStore.versions.find((v) => v.id === versionId);
      return version?.content[sectionId] ?? emptyResumeContent()[sectionId];
    },
    [versionStore]
  );

  const getSectionCardContent = useCallback(
    (sectionId: SectionId): ResumeContent => ({
      ...composedContent,
      [sectionId]: getSectionContent(sectionId),
    }),
    [composedContent, getSectionContent]
  );

  const handleSectionChange = useCallback(
    (sectionId: SectionId, next: ResumeContent) => {
      if (!versionStore) return;
      const versionId = versionStore.compose[sectionId];
      updateStore((s) => updateVersionSection(s, versionId, sectionId, next[sectionId]));
    },
    [versionStore, updateStore]
  );

  const handleSourceVersionChange = useCallback(
    (sectionId: SectionId, versionId: string) => {
      updateStore((s) => setSectionSource(s, sectionId, versionId));
    },
    [updateStore]
  );

  const handleCreateVersion = useCallback(
    (name: string) => {
      if (!versionStore) return;
      updateStore((s) => addVersion(s, name, composedContent));
    },
    [versionStore, composedContent, updateStore]
  );

  const handleRenameVersion = useCallback(
    (versionId: string, name: string) => {
      updateStore((s) => renameVersion(s, versionId, name));
    },
    [updateStore]
  );

  const handleDuplicateVersion = useCallback(
    (versionId: string) => {
      updateStore((s) => duplicateVersion(s, versionId));
    },
    [updateStore]
  );

  const runAIEdit = useCallback(
    async (target: EditTarget, instruction: string) => {
      if (!versionStore) return;
      const sectionId = target.sectionId;
      const slice = getEditSlice(
        { ...composedContent, [sectionId]: getSectionContent(sectionId) },
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
    [versionStore, composedContent, getSectionContent]
  );

  const handleAIAccept = useCallback(() => {
    if (!pendingAIEdit || !versionStore || pendingAIEdit.status !== "ready") return;

    const { target, suggested } = pendingAIEdit;
    const sectionId = target.sectionId;
    const versionId = versionStore.compose[sectionId];
    const currentVersion = versionStore.versions.find((v) => v.id === versionId);
    if (!currentVersion) return;

    const updatedContent = applyAIEdit(currentVersion.content, target, suggested);
    updateStore((s) =>
      updateVersionSection(s, versionId, sectionId, updatedContent[sectionId])
    );

    setPendingAIEdit(null);
    setAiOpenSections({});
    setBulletAIOpen(null);
  }, [pendingAIEdit, versionStore, updateStore]);

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

  if (!versionStore) {
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
                  versions={versionStore.versions}
                  sourceVersionId={versionStore.compose[sectionId]}
                  onSourceVersionChange={(vid) => handleSourceVersionChange(sectionId, vid)}
                  aiOpen={!!aiOpenSections[section.id]}
                  onToggleAI={() =>
                    setAiOpenSections((prev) => ({
                      ...prev,
                      [section.id]: !prev[section.id],
                    }))
                  }
                  pendingAIEdit={pendingAIEdit}
                  onAIRequest={(instruction) => handleSectionAIRequest(sectionId, instruction)}
                  onAIAccept={handleAIAccept}
                  onAIReject={handleAIReject}
                  onBulletAIRequest={
                    sectionId === "work" || sectionId === "project" || sectionId === "education"
                      ? (entryIndex, bulletIndex, instruction) =>
                          handleBulletAIRequest(sectionId, entryIndex, bulletIndex, instruction)
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
                      isSame ? null : { sectionId: section.id, entryIndex, bulletIndex }
                    );
                    setAiOpenSections((prev) => ({ ...prev, [section.id]: false }));
                  }}
                />
              );
            })}
          </div>

          <VersionPanel
            open={versionPanelOpen}
            onToggle={() => setVersionPanelOpen((o) => !o)}
            store={versionStore}
            onCreateVersion={handleCreateVersion}
            onRenameVersion={handleRenameVersion}
            onDuplicateVersion={handleDuplicateVersion}
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
