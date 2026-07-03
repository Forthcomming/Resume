import type { Resume } from "@/types/resume";
import { NewResumeCard } from "./NewResumeCard";
import { ResumeCard } from "./ResumeCard";

export function ResumeGrid({
  resumes,
  localOnlyIds = new Set<string>(),
}: {
  resumes: Resume[];
  localOnlyIds?: Set<string>;
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <NewResumeCard />
      {resumes.map((resume) => (
        <ResumeCard
          key={resume.id}
          resume={resume}
          localOnly={localOnlyIds.has(resume.id)}
        />
      ))}
    </div>
  );
}
