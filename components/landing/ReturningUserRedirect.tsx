"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { hasCompletedApiKeyGate } from "@/lib/ai/user-api-key";
import {
  hasEnteredCookie,
  setEnteredCookie,
} from "@/lib/auth/entered-cookie";

/**
 * Legacy bridge: localStorage gate done but entered cookie missing → set cookie and go dashboard.
 * After first hop, middleware handles `/` without flashing landing.
 */
export function ReturningUserRedirect() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!hasCompletedApiKeyGate()) return;
    if (hasEnteredCookie()) {
      router.replace("/dashboard");
      return;
    }

    setEnteredCookie();
    router.replace("/dashboard");
  }, [router]);

  return null;
}
