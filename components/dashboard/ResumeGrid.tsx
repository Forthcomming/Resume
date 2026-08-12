import type { Resume } from "@/types/resume";
import { NewResumeCard } from "./NewResumeCard";
import { ResumeCard } from "./ResumeCard";

export function ResumeGrid({
  resumes,
  localOnlyIds = new Set<string>(),
  onDeleted,
}: {
  resumes: Resume[];
  localOnlyIds?: Set<string>;
  onDeleted?: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      <NewResumeCard />
      {resumes.map((resume) => (
        <ResumeCard
          key={resume.id}
          resume={resume}
          localOnly={localOnlyIds.has(resume.id)}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  );
}
