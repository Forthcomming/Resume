import { TopNav } from "@/components/layout/TopNav";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { DashboardResumeList } from "@/components/dashboard/DashboardResumeList";
import { NewResumeButton } from "@/components/dashboard/NewResumeButton";
import { NewResumeDialogProvider } from "@/components/dashboard/NewResumeDialogProvider";
import { listResumes } from "@/services/resumes";
import { DEMO_USER_ID } from "@/lib/resume/schema";

export default async function DashboardPage() {
  const resumes = await listResumes(DEMO_USER_ID);

  return (
    <div className="min-h-screen">
      <TopNav />

      <NewResumeDialogProvider>
        <main className="mx-auto w-full max-w-[700px] px-6 pb-24 pt-10">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-ink">
                我的简历
              </h1>
            </div>

            <NewResumeButton />
          </div>

          {/* Search */}
          <div className="mt-5">
            <SearchBar />
          </div>

          {/* Resume list (server + localStorage merge) */}
          <DashboardResumeList serverResumes={resumes} />
        </main>
      </NewResumeDialogProvider>
    </div>
  );
}
