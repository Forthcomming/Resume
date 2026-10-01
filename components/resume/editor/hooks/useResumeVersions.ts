"use client";

import {
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import { emptyResumeContent, type ResumeContent } from "@/lib/resume/content";
import type { DateDisplayFormat } from "@/lib/resume/date-display";
import {
  addSectionSubVersion,
  composeFromSectionSubVersions,
  deleteSectionSubVersion,
  duplicateSectionSubVersion,
  getActiveSectionContent,
  getActiveSectionVersionId,
  getDateDisplayFormat,
  getSectionDisplayTitle,
  getSectionOrder,
  getSectionVersions,
  renameSectionSubVersion,
  reorderSections,
  setActiveSectionVersion,
  setDateDisplayFormat,
  setSectionDisplayTitle,
  updateActiveSectionContent,
  type SectionId,
  type SectionSubVersion,
  type SectionSubVersionsStore,
} from "@/lib/resume/versions";

export interface UseResumeVersionsResult {
  composedContent: ResumeContent;
  sectionOrder: SectionId[];
  dateDisplayFormat: DateDisplayFormat;
  updateStore: (
    updater: (store: SectionSubVersionsStore) => SectionSubVersionsStore
  ) => void;
  updateSection: (sectionId: SectionId, next: ResumeContent) => void;
  getSectionCardContent: (sectionId: SectionId) => ResumeContent;
  getDisplayTitle: (sectionId: SectionId) => string;
  getVersions: (sectionId: SectionId) => SectionSubVersion[];
  getActiveVersionId: (sectionId: SectionId) => string;
  setActiveVersion: (sectionId: SectionId, versionId: string) => void;
  createVersion: (sectionId: SectionId, name: string) => void;
  renameVersion: (sectionId: SectionId, versionId: string, name: string) => void;
  duplicateVersion: (sectionId: SectionId, versionId: string) => void;
  deleteVersion: (sectionId: SectionId, versionId: string) => void;
  moveSection: (sectionId: SectionId, direction: -1 | 1) => void;
  updateSectionTitle: (sectionId: SectionId, title: string) => void;
  updateDateDisplayFormat: (format: DateDisplayFormat) => void;
}

export function useResumeVersions(
  store: SectionSubVersionsStore | null,
  setStore: Dispatch<SetStateAction<SectionSubVersionsStore | null>>
): UseResumeVersionsResult {
  const composedContent = useMemo(
    () => (store ? composeFromSectionSubVersions(store) : emptyResumeContent()),
    [store]
  );
  const sectionOrder = useMemo(
    () => (store ? getSectionOrder(store) : []),
    [store]
  );
  const dateDisplayFormat = store ? getDateDisplayFormat(store) : "YYYY.MM";

  const updateStore = useCallback(
    (updater: (value: SectionSubVersionsStore) => SectionSubVersionsStore) => {
      setStore((previous) => (previous ? updater(previous) : previous));
    },
    [setStore]
  );
  const updateSection = useCallback(
    (sectionId: SectionId, next: ResumeContent) =>
      updateStore((value) =>
        updateActiveSectionContent(value, sectionId, next[sectionId])
      ),
    [updateStore]
  );
  const getSectionCardContent = useCallback(
    (sectionId: SectionId): ResumeContent =>
      store
        ? {
            ...composedContent,
            [sectionId]: getActiveSectionContent(store, sectionId),
          }
        : emptyResumeContent(),
    [store, composedContent]
  );
  const getDisplayTitle = useCallback(
    (sectionId: SectionId) =>
      store ? getSectionDisplayTitle(store, sectionId) : "",
    [store]
  );
  const getVersions = useCallback(
    (sectionId: SectionId) =>
      store ? getSectionVersions(store, sectionId) : [],
    [store]
  );
  const getActiveVersionId = useCallback(
    (sectionId: SectionId) =>
      store ? getActiveSectionVersionId(store, sectionId) : "",
    [store]
  );
  const setActiveVersion = useCallback(
    (sectionId: SectionId, versionId: string) =>
      updateStore((value) =>
        setActiveSectionVersion(value, sectionId, versionId)
      ),
    [updateStore]
  );
  const createVersion = useCallback(
    (sectionId: SectionId, name: string) =>
      updateStore((value) => addSectionSubVersion(value, sectionId, name)),
    [updateStore]
  );
  const renameVersion = useCallback(
    (sectionId: SectionId, versionId: string, name: string) =>
      updateStore((value) =>
        renameSectionSubVersion(value, sectionId, versionId, name)
      ),
    [updateStore]
  );
  const duplicateVersion = useCallback(
    (sectionId: SectionId, versionId: string) =>
      updateStore((value) =>
        duplicateSectionSubVersion(value, sectionId, versionId)
      ),
    [updateStore]
  );
  const deleteVersion = useCallback(
    (sectionId: SectionId, versionId: string) =>
      updateStore((value) =>
        deleteSectionSubVersion(value, sectionId, versionId)
      ),
    [updateStore]
  );
  const moveSection = useCallback(
    (sectionId: SectionId, direction: -1 | 1) =>
      updateStore((value) => {
        const order = getSectionOrder(value);
        const fromIndex = order.indexOf(sectionId);
        return fromIndex < 0
          ? value
          : reorderSections(value, fromIndex, fromIndex + direction);
      }),
    [updateStore]
  );
  const updateSectionTitle = useCallback(
    (sectionId: SectionId, title: string) =>
      updateStore((value) => setSectionDisplayTitle(value, sectionId, title)),
    [updateStore]
  );
  const updateDateDisplayFormat = useCallback(
    (format: DateDisplayFormat) =>
      updateStore((value) => setDateDisplayFormat(value, format)),
    [updateStore]
  );

  return {
    composedContent,
    sectionOrder,
    dateDisplayFormat,
    updateStore,
    updateSection,
    getSectionCardContent,
    getDisplayTitle,
    getVersions,
    getActiveVersionId,
    setActiveVersion,
    createVersion,
    renameVersion,
    duplicateVersion,
    deleteVersion,
    moveSection,
    updateSectionTitle,
    updateDateDisplayFormat,
  };
}
