import { TopNav } from "@/components/layout/TopNav";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { DashboardResumeList } from "@/components/dashboard/DashboardResumeList";
import { NewResumeButton } from "@/components/dashboard/NewResumeButton";
import { NewResumeDialogProvider } from "@/components/dashboard/NewResumeDialogProvider";
import { EnsureAnonymousSession } from "@/components/auth/EnsureAnonymousSession";
import { listResumesForCurrentUser } from "@/services/resumes";

export default async function DashboardPage() {
  const resumes = await listResumesForCurrentUser();

  return (
    <div className="min-h-screen">
      <EnsureAnonymousSession />
      <TopNav activeHref="/dashboard" />

      <NewResumeDialogProvider>
        <main className="mx-auto w-full max-w-[700px] px-6 pb-24 pt-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-ink">
                我的简历
              </h1>
            </div>

            <NewResumeButton />
          </div>

          <div className="mt-5">
            <SearchBar />
          </div>

          <DashboardResumeList serverResumes={resumes} />
        </main>
      </NewResumeDialogProvider>
    </div>
  );
}
