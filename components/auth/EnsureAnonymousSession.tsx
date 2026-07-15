"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { bootstrapCloudSession } from "@/lib/auth/anonymous";

/**
 * Silently creates an anonymous Supabase session and migrates local resumes.
 * Mount on app pages that need cloud persistence (/dashboard, /settings, editor).
 */
export function EnsureAnonymousSession() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      const userId = await bootstrapCloudSession();
      if (userId) router.refresh();
    })();
  }, [router]);

  return null;
}
