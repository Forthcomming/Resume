import { notFound } from "next/navigation";
import { EnsureAnonymousSession } from "@/components/auth/EnsureAnonymousSession";
import { TailorWorkspace } from "@/components/resume/tailor/TailorWorkspace";
import { getResumeWorkspace } from "@/services/resume-content";
import { getResume } from "@/services/resumes";

export default async function ResumeTailorPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { title?: string };
}) {
  const [resume, workspace] = await Promise.all([
    getResume(params.id),
    getResumeWorkspace(params.id),
  ]);
  const fallbackTitle = searchParams.title?.trim();
  if (!resume && !fallbackTitle) notFound();

  return (
    <>
      <EnsureAnonymousSession />
      <TailorWorkspace
        resumeId={params.id}
        sourceTitle={resume?.title ?? fallbackTitle ?? "未命名简历"}
        initialContent={workspace?.content ?? null}
        initialVersionStore={workspace?.versionStore ?? null}
        cloudBacked={Boolean(workspace?.content && workspace.versionStore)}
      />
    </>
  );
}
