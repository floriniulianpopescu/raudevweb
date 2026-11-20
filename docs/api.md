# API reference

Base URL: `VITE_API_URL` (dev: `http://localhost:3000`). All responses are JSON.
Requests must send the session cookie (`credentials: "include"` in the browser). Request/response types are
exported from `@raudevweb/shared`.

**Access**: 🌐 public · 🔑 signed in (`requireAuth`) · 🛡️ admin (`requireAuth` + `requireRole("admin")`)

**Errors** (non-Better-Auth routes):

| Status | Body | When |
|---|---|---|
| 400 | `{ error: "Bad request", details }` | body failed zod validation (`details` = `error.flatten()`) |
| 401 | `{ error: "Unauthorized", message }` | no/expired session |
| 403 | `{ error: "Forbidden", message }` | not an admin |
| 404 | `{ error: "Not found" }` | unknown type/id |
| 500 | `{ error: "Internal server error" }` | anything else (logged on the server) |

## Health

| | Method & path | Returns |
|---|---|---|
| 🌐 | `GET /health` | `{ status: "ok", timestamp }` |
| 🌐 | `GET /` | welcome message |

## Auth — `/api/auth/*` (Better Auth)

Handled entirely by Better Auth (`apps/backend/src/lib/auth.ts`); the frontend uses its client
(`lib/auth-client.ts`). Main endpoints:

| Method & path | Purpose |
|---|---|
| `POST /api/auth/sign-up/email` | `{ name, email, password, callbackURL }` → sends the confirmation email |
| `POST /api/auth/sign-in/email` | `{ email, password }` → session cookie (403 if email not confirmed; sends a fresh link) |
| `POST /api/auth/sign-out` | ends the session |
| `GET /api/auth/get-session` | current user + session, or `null` |
| `GET /api/auth/verify-email?token=&callbackURL=` | confirms the email, logs in, redirects to the frontend |
| `POST /api/auth/send-verification-email` | `{ email, callbackURL }` → resend the confirmation link |
| `POST /api/auth/request-password-reset` | `{ email, redirectTo }` → reset email (same answer whether or not the account exists) |
| `POST /api/auth/reset-password` | `{ token, newPassword }` |
| `POST /api/auth/update-user` | `{ name }` (validated with the shared name rule) |

## User — `/api/user`

| | Method & path | Body → Returns |
|---|---|---|
| 🔑 | `GET /api/user/me` | `{ user, session }` |
| 🔑 | `PATCH /api/user/me` | `UpdateProfileInput` `{ name?, image? }` → `{ message, user }` |
| 🛡️ | `GET /api/user/admin/dashboard` | `{ message, stats: { totalUsers, totalSessions } }` |

## Content — `/api/content`

`:type` is one of `challenges | problems | exercises | quizzes | lessons | extras`.

| | Method & path | Returns |
|---|---|---|
| 🔑 | `GET /api/content/:type?limit=3` | newest first; `limit` optional (1–100). Problems/exercises: `LinkItem[]`; others: `ContentSummary[]` (`{ id, title, description }`) |
| 🔑 | `GET /api/content/:type/:id` | `ChallengeItem` / `QuizItem` (no correct answers) / `ResourceItem` (with `body` and `links`) / `LinkItem` |
| 🔑 | `POST /api/content/quizzes/:id/submit` | body `{ answers: number[5] }` → `QuizResult { score, total, correct[] }` |

## Progress (done checks) — `/api/progress`

`:type` is `problems | exercises`.

| | Method & path | Returns |
|---|---|---|
| 🔑 | `GET /api/progress` | `Progress` = `{ problems: { ids, xp }, exercises: { ids, xp } }` for the signed-in user |
| 🔑 | `PUT /api/progress/:type/:id` | tick as done → `CompletionResult { done: true, xpChange, xp }` (`xpChange` 0 if already done) |
| 🔑 | `DELETE /api/progress/:type/:id` | untick → `{ done: false, xpChange (≤ 0), xp }` (`xpChange` 0 if it wasn't done) |

Both writes are idempotent and safe to repeat; 404 if the item doesn't exist.

## Leaderboard — `/api/leaderboard`

| | Method & path | Returns |
|---|---|---|
| 🔑 | `GET /api/leaderboard?limit=50` | `LeaderboardResponse { entries, me, totalUsers }` (limit 1–100; confirmed, non-banned users only; no emails) |

## Schedule

| | Method & path | Body → Returns |
|---|---|---|
| 🌐 | `GET /api/schedule` | `SessionSchedule` (creates the default row on first use) |
| 🛡️ | `GET /api/admin/schedule` | `SessionSchedule` |
| 🛡️ | `PUT /api/admin/schedule` | `SessionScheduleInput` → `SessionSchedule` |

## Admin content — `/api/admin/:type`

Same `:type` values as `/api/content`. Bodies are validated with `ContentSchemas[type]`.

| | Method & path | Body → Returns |
|---|---|---|
| 🛡️ | `GET /api/admin/:type` | full items for the editors (quizzes include `correctIndex`; problems/exercises include `completedCount`) |
| 🛡️ | `GET /api/admin/:type/:id` | one full item |
| 🛡️ | `POST /api/admin/:type` | item → created item (201) |
| 🛡️ | `PATCH /api/admin/:type/:id` | full item (replaces it) → updated item |
| 🛡️ | `DELETE /api/admin/:type/:id` | → 204 |
| 🛡️ | `POST /api/admin/:type/bulk-delete` | `{ ids }` (1–500) → `{ count }` |

## Admin users / XP — `/api/admin/users`

| | Method & path | Body → Returns |
|---|---|---|
| 🛡️ | `GET /api/admin/users` | `UserXp[]` (highest XP first) |
| 🛡️ | `POST /api/admin/users/:id/xp` | `{ delta }` (±1…100,000, not 0) → `UserXp` (never below 0) |
| 🛡️ | `POST /api/admin/users/xp` | `{ ids, delta }` → `{ count }` |
