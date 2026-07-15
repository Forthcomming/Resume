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
        <p className="mt-1 text-[13px] text-ink-muted">
          管理 AI 相关配置
        </p>
        <div className="mt-6">
          <ApiKeySettingsForm />
        </div>
      </main>
    </div>
  );
}
