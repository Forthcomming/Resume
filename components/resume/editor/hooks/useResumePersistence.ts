"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  saveResumeWorkspaceAction,
  updateResumeTitleAction,
} from "@/app/resume/[id]/actions";
import {
  emptyResumeContent,
  normalizeResumeContent,
  type ResumeContent,
} from "@/lib/resume/content";
import {
  readLocalResumeIndex,
  resumeContentKey,
  saveLocalResumeContent,
  touchLocalResumeUpdated,
  upsertLocalResume,
} from "@/lib/resume/local-storage";
import {
  composeFromSectionSubVersions,
  initSectionSubVersionsStore,
  readSectionSubVersionsStore,
  saveSectionSubVersionsStore,
  type SectionSubVersionsStore,
} from "@/lib/resume/versions";
import type { SaveState } from "../EditorTopBar";

interface UseResumePersistenceOptions {
  id: string;
  title: string;
  initialContent: ResumeContent | null;
  initialVersionStore?: SectionSubVersionsStore | null;
  serverUpdatedAt?: string | null;
}

interface UseResumePersistenceResult {
  store: SectionSubVersionsStore | null;
  setStore: Dispatch<SetStateAction<SectionSubVersionsStore | null>>;
  resumeTitle: string;
  saveState: SaveState;
  retrySave: () => void;
  updateResumeTitle: (nextTitle: string) => Promise<void>;
}

function isLocalNewer(
  localUpdatedAt: string | null | undefined,
  serverUpdatedAt: string | null | undefined
): boolean {
  if (!localUpdatedAt) return false;
  if (!serverUpdatedAt) return true;
  return new Date(localUpdatedAt).getTime() > new Date(serverUpdatedAt).getTime();
}

function persistLocalDraft(resumeId: string, content: ResumeContent): void {
  try {
    saveLocalResumeContent(resumeId, content);
    touchLocalResumeUpdated(resumeId);
  } catch {
    /* ignore quota errors */
  }
}

export function useResumePersistence({
  id,
  title,
  initialContent,
  initialVersionStore = null,
  serverUpdatedAt = null,
}: UseResumePersistenceOptions): UseResumePersistenceResult {
  const [store, setStore] = useState<SectionSubVersionsStore | null>(null);
  const [resumeTitle, setResumeTitle] = useState(title);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const skipNextSave = useRef(true);
  const initialized = useRef(false);

  useEffect(() => setResumeTitle(title), [title]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let baseContent = initialContent ?? emptyResumeContent();
    if (!initialContent) {
      try {
        const raw = localStorage.getItem(resumeContentKey(id));
        if (raw) baseContent = normalizeResumeContent(JSON.parse(raw));
      } catch {
        /* ignore malformed cache */
      }
    }

    const localStore = readSectionSubVersionsStore(id);
    const localUpdatedAt =
      readLocalResumeIndex().find((entry) => entry.id === id)?.updatedAt ?? null;

    if (
      initialVersionStore &&
      localStore &&
      isLocalNewer(localUpdatedAt, serverUpdatedAt)
    ) {
      setStore(localStore);
      void saveResumeWorkspaceAction(
        id,
        composeFromSectionSubVersions(localStore),
        localStore
      );
      return;
    }
    if (initialVersionStore) {
      setStore(initialVersionStore);
      saveSectionSubVersionsStore(id, initialVersionStore);
      return;
    }
    if (localStore) {
      setStore(localStore);
      if (serverUpdatedAt !== null || initialContent) {
        void saveResumeWorkspaceAction(
          id,
          composeFromSectionSubVersions(localStore),
          localStore
        );
      }
      return;
    }

    const next = initSectionSubVersionsStore(baseContent);
    setStore(next);
    saveSectionSubVersionsStore(id, next);
    if (initialContent && !initialVersionStore) {
      void saveResumeWorkspaceAction(
        id,
        composeFromSectionSubVersions(next),
        next
      );
    }
  }, [id, initialContent, initialVersionStore, serverUpdatedAt]);

  const composedContent = useMemo(
    () => (store ? composeFromSectionSubVersions(store) : emptyResumeContent()),
    [store]
  );

  const saveNow = useCallback(
    async (nextStore: SectionSubVersionsStore, content: ResumeContent) => {
      setSaveState("saving");
      saveSectionSubVersionsStore(id, nextStore);
      try {
        const result = await saveResumeWorkspaceAction(id, content, nextStore);
        if (!result.configured) {
          persistLocalDraft(id, content);
          setSaveState("saved");
          return;
        }
        if (!result.ok) {
          persistLocalDraft(id, content);
          setSaveState("error");
          return;
        }
        try {
          touchLocalResumeUpdated(id);
        } catch {
          /* ignore quota errors */
        }
        setSaveState("saved");
      } catch {
        persistLocalDraft(id, content);
        setSaveState("error");
      }
    },
    [id]
  );

  const retrySave = useCallback(() => {
    if (store) void saveNow(store, composedContent);
  }, [store, composedContent, saveNow]);

  useEffect(() => {
    if (!store) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      void saveNow(store, composedContent);
    }, 800);
    return () => clearTimeout(timeout);
  }, [store, composedContent, saveNow]);

  const updateResumeTitle = useCallback(
    async (nextTitle: string) => {
      setResumeTitle(nextTitle);
      try {
        upsertLocalResume({ id, title: nextTitle });
      } catch {
        /* ignore quota errors */
      }
      const result = await updateResumeTitleAction(id, nextTitle);
      if (!result.configured) {
        try {
          touchLocalResumeUpdated(id);
        } catch {
          /* ignore quota errors */
        }
      }
    },
    [id]
  );

  return {
    store,
    setStore,
    resumeTitle,
    saveState,
    retrySave,
    updateResumeTitle,
  };
}
