import { TopNav } from "@/components/layout/TopNav";
import { ApiKeySettingsForm } from "@/components/settings/ApiKeySettingsForm";
import { EnsureAnonymousSession } from "@/components/auth/EnsureAnonymousSession";

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <EnsureAnonymousSession />
      <TopNav activeHref="/settings" />
      <main className="mx-auto w-full max-w-[700px] px-6 pb-24 pt-10">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">
          设置
        </h1>
        <div className="mt-6">
          <ApiKeySettingsForm />
        </div>
      </main>
    </div>
  );
}
