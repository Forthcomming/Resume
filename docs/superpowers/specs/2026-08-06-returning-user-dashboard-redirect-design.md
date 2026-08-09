# Returning user: `/` → `/dashboard` redirect

## Goal

Users who have already entered the product should land on the resume dashboard (`/dashboard`) when they open `/`, without clicking the landing CTA again. New users still see the landing page.

## Current behavior

- `/` always renders the marketing landing page.
- Entering the product happens via `EnterSystemButton`: complete or skip the DeepSeek API Key gate (`hasCompletedApiKeyGate()`), then `bootstrapCloudSession()` and navigate to `/dashboard`.
- Gate state lives only in `localStorage` (`resumekit:deepseek_api_key` / `resumekit:deepseek_api_key_skipped`), which middleware cannot read.

## Decision: Approach 2 (Middleware + Cookie)

Redirect at the edge when a server-readable “has entered” signal is present, so returning visits avoid (or minimize) a flash of the landing page. This path is intended to survive a future switch to real account login.

### Why not Approach 1 alone

Client-only `localStorage` redirect is enough for today’s gate, but the returning-user signal will change when real auth ships. Middleware + cookie (later: session) keeps the redirect mechanism stable.

### Why not Approach 3

Keeping the landing page as the only entry with no auto-redirect fails the product requirement.

## Returning-user criterion (now vs later)

| Phase | Criterion | Meaning |
|-------|-----------|---------|
| **Now** (anonymous + API Key gate) | **A** — `hasCompletedApiKeyGate()` | User saved a key or skipped setup on this browser |
| **Later** (real login: email / OAuth / etc.) | **Auth session** | User is signed in; do **not** use A |

**Explicit evolution rule:** API Key completion is a temporary stand-in for “has entered the product.” After real login launches, `/` → `/dashboard` must key off Auth session (or equivalent server session). A user may be logged in without a key, or have a leftover gate flag without being logged in — A must not remain the redirect predicate.

## Behavior

| Visitor | `GET /` |
|---------|---------|
| Never completed enter flow | Landing page |
| Completed enter (A), cookie present | Middleware `302` → `/dashboard` |
| Completed enter in localStorage only (legacy) | One-time client bridge: write cookie, then go to `/dashboard` |
| Other routes (`/dashboard`, editor, settings) | Unchanged |

Landing page remains reachable for marketing links after clear cookies / new browser, and for users who never entered.

## Implementation design

### Cookie

- Name: `resumekit_entered`
- Value: `1`
- Attributes: `Path=/`, `Max-Age` long-lived (e.g. 1 year), `SameSite=Lax`. Not `HttpOnly` so the legacy bridge can set it from the client; contains no secrets and no API key material.
- Written when the enter flow succeeds (CTA with gate already done, or after modal save/skip + continue).

### Middleware

- Keep existing Supabase `updateSession` refresh.
- After session refresh: if `pathname === "/"` and `resumekit_entered=1`, `NextResponse.redirect` to `/dashboard` (preserve host; use request URL origin).
- Do not redirect other paths.

### Client write + legacy bridge

- Shared helper to set/clear the cookie (and optionally read it) used by `EnterSystemButton` / enter success path.
- On landing only: if `hasCompletedApiKeyGate()` and cookie missing → set cookie → `router.replace("/dashboard")` (covers users who entered before this feature).

### Unchanged

- `localStorage` API Key storage and AI request headers.
- Anonymous bootstrap on app pages via `EnsureAnonymousSession`.
- Dashboard / editor / settings behavior.

## Future: real login

1. Middleware: if signed-in session on `/`, redirect to `/dashboard` (replace or OR with `resumekit_entered` during migration).
2. Stop treating A as the redirect source of truth; optionally stop writing `resumekit_entered` once session is reliable.
3. API Key gate becomes settings / first-AI-use UX, not “are you a returning user.”

## Out of scope

- Implementing real email/OAuth login.
- Changing API Key modal copy or settings UX.
- Protecting `/dashboard` behind auth (still anonymous-capable as today).

## Success criteria

- New browser / cleared storage: `/` shows landing; enter flow still works.
- After enter: revisit `/` goes to `/dashboard` without requiring another CTA click.
- Existing localStorage-gate users get redirected after at most one client bridge hop.
- Spec documents that post–real-login, criterion switches from A to Auth session.
