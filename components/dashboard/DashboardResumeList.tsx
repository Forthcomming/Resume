"use client";

import { useCallback, useEffect, useState } from "react";
import type { Resume } from "@/types/resume";
import {
  mergeResumeLists,
  readLocalResumeIndex,
  RESUME_INDEX_CHANGED,
  RESUME_INDEX_KEY,
} from "@/lib/resume/local-storage";
import { ResumeGrid } from "./ResumeGrid";

interface DashboardResumeListProps {
  serverResumes: Resume[];
}

export function DashboardResumeList({
  serverResumes,
}: DashboardResumeListProps) {
  const [merged, setMerged] = useState(() => {
    const local = readLocalResumeIndex();
    return mergeResumeLists(serverResumes, local);
  });

  const refresh = useCallback(() => {
    const local = readLocalResumeIndex();
    setMerged(mergeResumeLists(serverResumes, local));
  }, [serverResumes]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === RESUME_INDEX_KEY || e.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(RESUME_INDEX_CHANGED, refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(RESUME_INDEX_CHANGED, refresh);
    };
  }, [refresh]);

  return (
    <>
      <p className="mt-1.5 text-[12px] text-ink-muted">
        共 {merged.resumes.length} 份简历 · 上次编辑 今天
      </p>
      <div className="mt-4">
        <ResumeGrid
          resumes={merged.resumes}
          localOnlyIds={merged.localOnlyIds}
        />
      </div>
    </>
  );
}
