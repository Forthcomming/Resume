import { notFound } from "next/navigation";
import { getResume } from "@/services/resumes";
import { getResumeContent } from "@/services/resume-content";
import { ResumeEditor } from "@/components/resume/editor/ResumeEditor";

export default async function ResumeEditorPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { title?: string };
}) {
  const resume = await getResume(params.id);

  // A freshly created/imported resume in localStorage-only mode (no Supabase)
  // won't be found server-side; fall back to the title passed via query string.
  const fallbackTitle = searchParams.title?.trim();
  if (!resume && !fallbackTitle) {
    notFound();
  }

  const initialContent = await getResumeContent(params.id);

  return (
    <ResumeEditor
      id={params.id}
      title={resume?.title ?? fallbackTitle ?? "未命名简历"}
      initialContent={initialContent}
    />
  );
}
