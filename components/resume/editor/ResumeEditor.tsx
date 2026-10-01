"use client";

import { useCallback, useMemo, useState } from "react";
import { AIModal } from "./AIModal";
import { EditorTopBar } from "./EditorTopBar";
import { JDTailorEntry } from "./JDTailorEntry";
import { ResumePreview } from "./ResumePreview";
import { SectionEditorCard } from "./SectionEditorCard";
import { useResumeAIEdit } from "./hooks/useResumeAIEdit";
import { useResumePersistence } from "./hooks/useResumePersistence";
import { useResumeVersions } from "./hooks/useResumeVersions";
import { getEditorSectionsInOrder } from "./sections";
import type { ResumeContent } from "@/lib/resume/content";
import {
  DEFAULT_SECTION_LABELS,
  type SectionId,
  type SectionSubVersionsStore,
} from "@/lib/resume/versions";

interface ResumeEditorProps {
  id: string;
  title: string;
  initialContent: ResumeContent | null;
  initialVersionStore?: SectionSubVersionsStore | null;
  serverUpdatedAt?: string | null;
}

export function ResumeEditor({
  id,
  title,
  initialContent,
  initialVersionStore = null,
  serverUpdatedAt = null,
}: ResumeEditorProps) {
  const persistence = useResumePersistence({
    id,
    title,
    initialContent,
    initialVersionStore,
    serverUpdatedAt,
  });
  const versions = useResumeVersions(persistence.store, persistence.setStore);
  const ai = useResumeAIEdit({
    store: persistence.store,
    composedContent: versions.composedContent,
    updateStore: versions.updateStore,
  });
  const orderedSections = useMemo(
    () => getEditorSectionsInOrder(versions.sectionOrder),
    [versions.sectionOrder]
  );
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPdf = useCallback(async () => {
    if (exportingPdf) return;
    const root = document.querySelector(
      "[data-resume-pdf-root]"
    ) as HTMLElement | null;
    if (!root) return;

    setExportingPdf(true);
    try {
      const { downloadResumePdf } = await import("@/lib/resume/export-pdf");
      await downloadResumePdf({
        element: root,
        filename: persistence.resumeTitle || "resume",
      });
    } catch (error) {
      console.error("[export-pdf]", error);
      window.alert("导出 PDF 失败，请稍后重试");
    } finally {
      setExportingPdf(false);
    }
  }, [exportingPdf, persistence.resumeTitle]);

  const store = persistence.store;
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
        title={persistence.resumeTitle}
        saveState={persistence.saveState}
        onTitleChange={persistence.updateResumeTitle}
        onExportPdf={handleExportPdf}
        exportingPdf={exportingPdf}
        onRetrySave={persistence.retrySave}
      />

      <div className="flex min-h-0 flex-1">
        <div className="glass-surface no-print flex w-1/2 min-w-0 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-auto p-5">
            {orderedSections.map((section, index) => {
              const sectionId = section.id as SectionId;
              const bulletOpenForSection =
                ai.bulletAIOpen?.sectionId === section.id
                  ? ai.bulletAIOpen
                  : null;

              return (
                <SectionEditorCard
                  key={section.id}
                  section={section}
                  displayTitle={versions.getDisplayTitle(sectionId)}
                  defaultTitle={DEFAULT_SECTION_LABELS[sectionId]}
                  onTitleChange={(nextTitle) =>
                    versions.updateSectionTitle(sectionId, nextTitle)
                  }
                  content={versions.getSectionCardContent(sectionId)}
                  onChange={(next) => versions.updateSection(sectionId, next)}
                  versions={versions.getVersions(sectionId)}
                  activeVersionId={versions.getActiveVersionId(sectionId)}
                  onActiveVersionChange={(versionId) =>
                    versions.setActiveVersion(sectionId, versionId)
                  }
                  onCreateSubVersion={(name) =>
                    versions.createVersion(sectionId, name)
                  }
                  onRenameSubVersion={(versionId, name) =>
                    versions.renameVersion(sectionId, versionId, name)
                  }
                  onDuplicateSubVersion={(versionId) =>
                    versions.duplicateVersion(sectionId, versionId)
                  }
                  onDeleteSubVersion={(versionId) =>
                    versions.deleteVersion(sectionId, versionId)
                  }
                  aiOpen={!!ai.aiOpenSections[section.id]}
                  onToggleAI={() => ai.toggleSectionAI(sectionId)}
                  pendingAIEdit={ai.pendingAIEdit}
                  bulletAIOpen={
                    bulletOpenForSection
                      ? {
                          entryIndex: bulletOpenForSection.entryIndex,
                          bulletIndex: bulletOpenForSection.bulletIndex,
                        }
                      : null
                  }
                  onToggleBulletAI={(entryIndex, bulletIndex) =>
                    ai.toggleBulletAI(
                      sectionId as "work" | "project" | "education",
                      entryIndex,
                      bulletIndex
                    )
                  }
                  dateDisplayFormat={versions.dateDisplayFormat}
                  onDateDisplayFormatChange={versions.updateDateDisplayFormat}
                  canMoveUp={index > 0}
                  canMoveDown={index < orderedSections.length - 1}
                  onMoveUp={() => versions.moveSection(sectionId, -1)}
                  onMoveDown={() => versions.moveSection(sectionId, 1)}
                />
              );
            })}
          </div>

          <JDTailorEntry
            resumeId={id}
            title={persistence.resumeTitle}
            saveState={persistence.saveState}
            onRetrySave={persistence.retrySave}
          />
        </div>

        <div className="w-1/2 min-w-0 overflow-auto px-8 py-2">
          <ResumePreview
            title={persistence.resumeTitle}
            content={versions.composedContent}
            sectionOrder={versions.sectionOrder}
            sectionTitles={store.sectionTitles}
            dateDisplayFormat={versions.dateDisplayFormat}
          />
        </div>
      </div>

      <AIModal
        open={ai.aiModalMeta !== null}
        title={ai.aiModalMeta?.title ?? "AI 优化"}
        subtitle={ai.aiModalMeta?.subtitle}
        promptPlaceholder={ai.aiModalMeta?.placeholder}
        target={
          ai.aiModalMeta?.target ?? { scope: "section", sectionId: "summary" }
        }
        originalContent={ai.aiModalMeta?.originalContent ?? ""}
        pendingAIEdit={ai.pendingAIEdit}
        onClose={ai.closeAIEdit}
        onSubmit={ai.submitAIEdit}
        onAccept={ai.acceptAIEdit}
        onRetry={ai.rejectAIEdit}
        onDismissSuggestion={ai.closeAIEdit}
      />
    </div>
  );
}
