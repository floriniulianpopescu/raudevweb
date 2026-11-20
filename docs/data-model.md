# Data model

Source of truth: [`apps/backend/prisma/schema.prisma`](../apps/backend/prisma/schema.prisma) (PostgreSQL, Prisma 6).
The schema is applied with **`prisma db push`**; there are no migration files. `deploy.sh` runs it on every deploy
and stops instead of deleting data if a change would be destructive.

```
User ─┬─< Session
      ├─< Account                 (Better Auth: password hash lives here)
      ├─< ProblemCompletion >── Problem ──┐
      └─< ExerciseCompletion >─ Exercise ─┤
                                          └─< (many-to-many) >─ Challenge
Quiz ─< QuizQuestion
Resource ─< ResourceLink          (kind = lesson | extra)
SessionSchedule                   (single row, id "default")
Verification                      (Better Auth: email + reset tokens)
```

## Auth tables (Better Auth)

| Model | Table | Notes |
|---|---|---|
| `User` | `user` | `name`, `email` (unique), `emailVerified`, `image`, `role` ("user"/"admin"), `banned`/`banReason`/`banExpires` (admin plugin), **`xp`** (int, default 0) |
| `Session` | `session` | cookie sessions; deleted with the user |
| `Account` | `account` | provider accounts; for email+password, holds the password hash |
| `Verification` | `verification` | email-verification and password-reset tokens |

Don't rename Better Auth fields; the adapter maps them by name. Adding fields/relations to `User` is fine.

## Content

| Model | Table | Notes |
|---|---|---|
| `Problem` | `problem` | `title`, `description`, `href` (external URL) |
| `Exercise` | `exercise` | same as `Problem` |
| `Challenge` | `challenge` | implicit many-to-many with `Problem` and `Exercise` |
| `Quiz` | `quiz` | has 5 `QuizQuestion`s |
| `QuizQuestion` | `quiz_question` | `position`, `question`, `answers` (string[4]), `correctIndex`; cascade-deleted with the quiz |
| `Resource` | `resource` | lessons and extras (`kind` enum); `body` = Markdown (default `""`) |
| `ResourceLink` | `resource_link` | a source: `position`, `title`, `description`, `href`; cascade-deleted with the resource |

Ids are `cuid()`. Ordering: lists by `createdAt desc`; questions and links by `position`; a challenge's problems and
exercises by title.

## Progress

| Model | Table | Key | Notes |
|---|---|---|---|
| `ProblemCompletion` | `problem_completion` | (`userId`, `problemId`) | `xp` = what the tick awarded; `createdAt` |
| `ExerciseCompletion` | `exercise_completion` | (`userId`, `exerciseId`) | same |

- The composite primary key makes "done" unique per user and item.
- Both foreign keys cascade: deleting a user or an item deletes its completions. **`user.xp` is not touched by
  that cascade**: earned XP is kept.
- `user.xp` is the running total of completion XP and admin adjustments. There is no ledger of admin
  adjustments, so you can't recompute it from the completion rows.

## Settings

| Model | Table | Notes |
|---|---|---|
| `SessionSchedule` | `session_schedule` | single row `id = "default"`: `weekday` (0 = Sunday), `startTime`/`endTime` ("HH:MM"), `location`, `note`, `title`, `semesterStart` ("YYYY-MM-DD" or null), `cancelled` |

## Changing the schema

1. Edit `schema.prisma` and run `bun run db:push` in `apps/backend` (this also regenerates the client).
   Restart the backend: the running process keeps the old Prisma client.
2. Prefer **additive** changes: new tables, or new columns with a `@default` or nullable. They apply on deploy
   without prompts. Renames and drops make `db push` stop; plan those (back up, migrate data by hand).
3. Update the shared types/schemas, [this doc](data-model.md), and add a **Deploy notes** line to the
   [changelog](../CHANGELOG.md).
4. To rehearse a deploy, see the "migration rehearsal" in [development.md](development.md#rehearse-a-schema-change).
