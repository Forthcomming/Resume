"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { hasCompletedApiKeyGate } from "@/lib/ai/user-api-key";
import {
  hasEnteredCookie,
  LANDING_INTRO_QUERY,
  setEnteredCookie,
} from "@/lib/auth/entered-cookie";

/**
 * Legacy bridge: localStorage gate done but entered cookie missing → set cookie and go dashboard.
 * After first hop, middleware handles `/` without flashing landing.
 * Skipped when `?intro=1` (intentional visit to marketing page).
 */
export function ReturningUserRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (searchParams.get(LANDING_INTRO_QUERY) === "1") return;
    if (!hasCompletedApiKeyGate()) return;
    if (hasEnteredCookie()) {
      router.replace("/dashboard");
      return;
    }

    setEnteredCookie();
    router.replace("/dashboard");
  }, [router, searchParams]);

  return null;
}
