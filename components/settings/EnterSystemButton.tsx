"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { hasCompletedApiKeyGate } from "@/lib/ai/user-api-key";
import { bootstrapCloudSession } from "@/lib/auth/anonymous";
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

  const enterDashboard = async () => {
    setBusy(true);
    try {
      await bootstrapCloudSession();
      router.push("/dashboard");
      router.refresh();
    } finally {
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
        open={open}
        onClose={() => setOpen(false)}
        onContinue={enterDashboard}
      />
    </>
  );
}
