const KEY_STORAGE = "resumekit:deepseek_api_key";
const SKIPPED_STORAGE = "resumekit:deepseek_api_key_skipped";

export const DEEPSEEK_API_KEY_HEADER = "x-deepseek-api-key";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getUserDeepseekApiKey(): string | null {
  if (!canUseStorage()) return null;
  const value = localStorage.getItem(KEY_STORAGE)?.trim();
  return value || null;
}

export function setUserDeepseekApiKey(key: string): void {
  if (!canUseStorage()) return;
  const trimmed = key.trim();
  if (!trimmed) {
    localStorage.removeItem(KEY_STORAGE);
    return;
  }
  localStorage.setItem(KEY_STORAGE, trimmed);
  localStorage.removeItem(SKIPPED_STORAGE);
}

export function clearUserDeepseekApiKey(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(KEY_STORAGE);
}

export function hasSkippedApiKeySetup(): boolean {
  if (!canUseStorage()) return false;
  return localStorage.getItem(SKIPPED_STORAGE) === "1";
}

export function setSkippedApiKeySetup(): void {
  if (!canUseStorage()) return;
  localStorage.setItem(SKIPPED_STORAGE, "1");
}

export function clearSkippedApiKeySetup(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(SKIPPED_STORAGE);
}

/** Whether landing CTAs can skip the setup modal. */
export function hasCompletedApiKeyGate(): boolean {
  return Boolean(getUserDeepseekApiKey()) || hasSkippedApiKeySetup();
}

export function maskDeepseekApiKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 3)}••••${trimmed.slice(-4)}`;
}

/** Headers to attach on AI API requests from the browser. */
export function deepseekAuthHeaders(): Record<string, string> {
  const key = getUserDeepseekApiKey();
  if (!key) return {};
  return { [DEEPSEEK_API_KEY_HEADER]: key };
}
