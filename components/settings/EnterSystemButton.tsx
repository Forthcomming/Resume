"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { hasCompletedApiKeyGate } from "@/lib/ai/user-api-key";
import { bootstrapCloudSession } from "@/lib/auth/anonymous";
import { setEnteredCookie } from "@/lib/auth/entered-cookie";
import { ApiKeySetupModal } from "./ApiKeySetupModal";

interface EnterSystemButtonProps {
  className?: string;
  children: ReactNode;
}

/** Landing CTA: anonymous session + API key gate, then dashboard. */
export function EnterSystemButton({
  className,
  children,
}: EnterSystemButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const enterDashboard = async () => {
    setBusy(true);
    setOpen(false);
    try {
      await bootstrapCloudSession();
      setEnteredCookie();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setBusy(false);
    }
  };

  const handleClick = () => {
    if (busy) return;
    if (hasCompletedApiKeyGate()) {
      void enterDashboard();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={className}
      >
        {children}
      </button>
      <ApiKeySetupModal
        open={open && !busy}
        onClose={() => setOpen(false)}
        onContinue={enterDashboard}
      />
      {busy && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
              <div
                role="status"
                aria-live="polite"
                className="glass-panel relative flex w-full max-w-sm flex-col items-center gap-3 rounded-[20px] px-6 py-8"
              >
                <Loader2
                  size={28}
                  strokeWidth={2}
                  className="animate-spin text-landing-ink"
                />
                <p className="text-[16px] font-semibold text-landing-ink">
                  正在进入…
                </p>
                <p className="text-center text-[13px] leading-relaxed text-landing-muted">
                  正在进入工作台，请稍候
                </p>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
