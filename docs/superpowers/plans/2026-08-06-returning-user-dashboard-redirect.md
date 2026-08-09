# Returning user dashboard redirect Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Returning users (API Key gate completed) hit `/` and are redirected to `/dashboard` via middleware cookie, with a localStorage→cookie bridge for legacy users.

**Architecture:** Set `resumekit_entered=1` on successful enter; middleware redirects `/` when cookie present; tiny landing client migrates old localStorage-only users.

**Tech Stack:** Next.js 14 middleware, document cookie, existing `hasCompletedApiKeyGate()`.

## Global Constraints

- Criterion now = A (`hasCompletedApiKeyGate`); later = Auth session (see spec).
- Cookie must not store API key material.
- Minimal diffs; do not change dashboard/editor behavior.
- Chinese UI copy unchanged unless needed.

## File map

| File | Role |
|------|------|
| `lib/auth/entered-cookie.ts` | Cookie name + get/set helpers (client-safe) |
| `lib/supabase/middleware.ts` or `middleware.ts` | Redirect `/` when cookie set |
| `components/settings/EnterSystemButton.tsx` | Set cookie on successful enter |
| `components/landing/ReturningUserRedirect.tsx` | Legacy bridge on landing |
| `components/landing/LandingPage.tsx` | Mount bridge |

---

### Task 1: Cookie helper

**Files:** create `lib/auth/entered-cookie.ts`

- [ ] Export `ENTERED_COOKIE = "resumekit_entered"`, `setEnteredCookie()`, `hasEnteredCookie()`, `clearEnteredCookie()` using `document.cookie` with Path=/; Max-Age=31536000; SameSite=Lax
- [ ] Guard with `typeof document !== "undefined"`

### Task 2: Middleware redirect

**Files:** `lib/supabase/middleware.ts` (or `middleware.ts`)

- [ ] After session refresh, if `request.nextUrl.pathname === "/"` and request has `resumekit_entered=1`, return `NextResponse.redirect(new URL("/dashboard", request.url))` using the same response cookie-writing pattern so session cookies are not dropped (prefer redirect from a response that already applied `setAll`, or copy cookies onto redirect)

### Task 3: Set cookie on enter

**Files:** `components/settings/EnterSystemButton.tsx`

- [ ] Before `router.push("/dashboard")` in `enterDashboard`, call `setEnteredCookie()`

### Task 4: Legacy bridge on landing

**Files:** create `components/landing/ReturningUserRedirect.tsx`; edit `LandingPage.tsx`

- [ ] Client component: on mount, if `hasCompletedApiKeyGate()` and !`hasEnteredCookie()`, `setEnteredCookie()` then `router.replace("/dashboard")`
- [ ] Render from `LandingPage` (returns null)

### Task 5: Manual verify

- [ ] Cleared cookies+storage: `/` shows landing
- [ ] Complete enter: revisit `/` → dashboard (middleware)
- [ ] Simulate localStorage gate without cookie: `/` bridge → dashboard
