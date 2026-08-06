import { notFound } from "next/navigation";
import { getResume } from "@/services/resumes";
import { getResumeWorkspace } from "@/services/resume-content";
import { ResumeEditor } from "@/components/resume/editor/ResumeEditor";
import { EnsureAnonymousSession } from "@/components/auth/EnsureAnonymousSession";

export default async function ResumeEditorPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { title?: string };
}) {
  const resume = await getResume(params.id);

  // Fresh local-only resumes may not exist server-side yet.
  const fallbackTitle = searchParams.title?.trim();
  if (!resume && !fallbackTitle) {
    notFound();
  }

  const workspace = await getResumeWorkspace(params.id);

  return (
    <>
      <EnsureAnonymousSession />
      <ResumeEditor
        id={params.id}
        title={resume?.title ?? fallbackTitle ?? "未命名简历"}
        initialContent={workspace?.content ?? null}
        initialVersionStore={workspace?.versionStore ?? null}
        serverUpdatedAt={workspace?.updatedAt ?? null}
      />
    </>
  );
}
