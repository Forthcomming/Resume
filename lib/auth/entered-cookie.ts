/** Cookie: server-readable “has entered product” (criterion A today; Auth session later). */
export const ENTERED_COOKIE = "resumekit_entered";
export const ENTERED_COOKIE_VALUE = "1";
/** 1 year */
export const ENTERED_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Intentional visit to marketing landing; skips returning-user auto-redirect. */
export const LANDING_INTRO_QUERY = "intro";
export const LANDING_INTRO_HREF = `/?${LANDING_INTRO_QUERY}=1`;

function canUseDocumentCookie(): boolean {
  return typeof document !== "undefined";
}

export function hasEnteredCookie(): boolean {
  if (!canUseDocumentCookie()) return false;
  return document.cookie
    .split("; ")
    .some((part) => part.startsWith(`${ENTERED_COOKIE}=`));
}

export function setEnteredCookie(): void {
  if (!canUseDocumentCookie()) return;
  document.cookie = `${ENTERED_COOKIE}=${ENTERED_COOKIE_VALUE}; Path=/; Max-Age=${ENTERED_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearEnteredCookie(): void {
  if (!canUseDocumentCookie()) return;
  document.cookie = `${ENTERED_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
