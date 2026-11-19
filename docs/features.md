# Features

What the site does today, how each feature behaves and where its code lives.
Paths are relative to `apps/frontend/src` (FE), `apps/backend/src` (BE) and `packages/shared/src` (shared).

## Accounts and auth

| Behaviour | Details |
|---|---|
| Sign-up | Name (2+ chars, enforced on the server too), email, password (8+). The account must be **confirmed by email** before it can log in. The page always says "check your inbox", even for an existing email, so it can't be used to discover accounts; the owner of an existing account gets an "already registered" email instead. |
| Email confirmation | The link (valid 24 h) goes to the backend, which verifies it, **logs the user in** and redirects to `/verify-email`. Logging in while unconfirmed sends a fresh link. |
| Login | Redirects back to the `/home…` page the user originally asked for. |
| Forgot / reset password | Reset link valid 1 h. Resetting signs the user out on every device, invalidates other reset links and sends a "password changed" notice. |
| Settings | Change username, send a reset link to yourself, log out (`components/app-settings-page.tsx`). |
| Admins | `user.role = "admin"` (Better Auth admin plugin). See the root README for promoting an account. |

Code: BE `lib/auth.ts`, `lib/email.ts`; FE `LoginPage.tsx`, `SignupPage.tsx`, `ForgotPage.tsx`, `ResetPage.tsx`,
`VerifyEmailPage.tsx`, `lib/auth-client.ts`, `lib/email-verification.ts`, `lib/password-reset.ts`,
`components/route-guards.tsx`.

## Content

Six content types, all defined by `CONTENT_TYPES` / `ContentSchemas` (shared) and `CONTENT` (FE `lib/content.ts`):

| Type | Where it opens | Shape |
|---|---|---|
| Problems | external site (new tab) | title, description, link. **Can be ticked as done (+20 XP).** |
| Exercises | external site (new tab) | title, description, link. **Can be ticked as done (+10 XP).** |
| Challenges | `/home/challenges/:id` | groups problems and exercises |
| Quizzes | `/home/quizzes/:id` | exactly 5 questions × 4 answers, one correct; graded on the server, answers revealed after submitting. No XP. |
| Lessons | `/home/lessons/:id` | description, optional **Markdown body**, sources (1–50 links) |
| Extras | `/home/extras/:id` | same as lessons |

- List pages (`ContentList`) have search, a 404 for missing items and friendly errors with Retry.
- Data access: BE `lib/content.ts`, routes in `routes/content.route.ts`.

### Lesson / extra body (Markdown)

- Optional, up to 50,000 characters (`RESOURCE_BODY_MAX`). Shown between the description and the **Sources**.
- Supports GitHub-flavoured Markdown (headings, lists, links, tables, footnotes, task lists) and callouts:
  `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`.
- Fenced code blocks get syntax highlighting (Shiki, light and dark themes), a language label ("C++") and a
  Copy button. Unknown languages render as plain text.
- Safety: raw HTML in the source is ignored, `javascript:` links are neutralised, images render as links
  (there is no image hosting). The page title is the only `<h1>`; `#` headings render as `<h2>`.
- Admin editor: "Body (Markdown)" field with **Write / Preview** tabs; the preview renders exactly like the page.
- Code: FE `components/markdown/` (`markdown.tsx` renderer + callout plugin, `code-block.tsx`, `highlight.ts`,
  `index.tsx` lazy wrapper), `components/resource-page.tsx`, `BodyField` in `components/admin/editors.tsx`.

## XP

A user's XP is one number (`user.xp`) shown on the leaderboard. It changes in two ways:

### 1. Done checks (automatic, honor system)

- Every problem and exercise has a **Mark as done** check: on the Problems and Exercises lists, on challenge pages
  and (compact) on the home "Latest" cards.
- Ticking adds `COMPLETION_XP` (shared `constants.ts`): **problems 20, exercises 10**. Unticking takes back exactly
  what that tick gave (stored on the completion row), never below 0.
- The check flips immediately (optimistic update) and a short "+20 XP" / "−20 XP" appears; on failure it flips back
  and shows "Couldn't save. Try again."
- Progress lines: "7 / 20 done · 140 XP earned" on each list, and "3 / 7 done · 50 XP earned" per challenge.
- Each tick/untick runs in one transaction and the completion row is unique per user+item, so double clicks or two
  tabs can't award or remove XP twice.
- Deleting a problem/exercise removes its completion rows but **users keep the XP**.
- Admin lists show "N completed" per item.
- Code: BE `lib/progress.ts`, `routes/progress.route.ts`; FE `lib/progress.ts` (`useProgress`, `useToggleDone`),
  `components/done-check.tsx` (`DoneCheck`, `ProgressSummary`, `ChallengeProgress`).

### 2. Admin adjustments

- Leaderboard page and home dashboard → **XP** tab: add/deduct per user (quick +10/+50/+100 or any amount up to
  100,000), or the same amount for many selected users. Totals never go below 0.
- Code: BE `routes/xp.route.ts`; FE `components/admin/xp-manager.tsx`.

## Leaderboard

- `/home/leaderboard`: top 50 (max 100) by XP, competition ranking (ties share a rank: 1, 2, 2, 4), plus the
  signed-in user's own row even when outside the top list. Never exposes emails.
- Only **confirmed, non-banned** users appear and count toward ranks.
- Code: BE `routes/leaderboard.route.ts`; FE `components/app-leaderboard-page.tsx`.

## Weekly physical session

- One editable schedule row: weekday, start/end time, location, note, this week's lesson title, a "cancelled this
  week" switch and the semester start date (week numbers count from it; empty → calendar week).
- Shown on the landing page (public) and as the session card on `/home`, with a live status: Upcoming / Today /
  In progress / Done this week.
- Code: BE `routes/schedule.route.ts`; FE `components/home/session-card.tsx`, `lib/schedule.ts`,
  `components/admin/schedule-manager.tsx`.

## Admin dashboards

- Hidden for non-admins (and not even downloaded); every admin endpoint is also protected on the server.
- **Per-page panels** at the top of each content list and the leaderboard ("Admin dashboard · Problems",
  collapsed until **Manage**).
- **Home dashboard** on `/home` with tabs for every content type, XP and Session schedule.
- Content editors (`components/admin/editors.tsx`, `crud-manager.tsx`): create, edit, delete, search, bulk delete
  (up to 500), validation errors per field.
- Saving invalidates the cached pages so every open list and card shows the change.

## Site-wide behaviour

- **Tab titles** on every page ("Lessons · RAUDEV").
- **404 pages** for unknown URLs and missing items.
- **Friendly errors** with Retry instead of raw server messages; auth forms never hang when the server is down.
- **Instant back navigation** from cached data, and **scroll restoration** on Back/Forward.
- **Dark mode** (light/dark/system, remembered per browser, no flash on load).
- **Link previews**: description + Open Graph image (`public/og-image.png`, 1200×630); the landing page is
  prerendered for crawlers. See [deployment.md](deployment.md) for `VITE_SITE_URL`.
- **About page** with the managing staff (`data/staff.ts`, photos in `public/staff/`).
