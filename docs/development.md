# Development guide

Conventions, recipes for common changes, and how to verify a change before pushing.
Setup is in the [root README](../README.md); the big picture is in [architecture.md](architecture.md).

## Conventions

**Code**
- **Validate with the shared zod schemas** on both sides. A rule lives in `packages/shared` once; the backend
  enforces it, the frontend uses it for instant feedback.
- **Keep the landing page light.** `FirstPage.tsx` is in the main bundle: import constants from
  `@raudevweb/shared/constants` (zod-free), never from `@raudevweb/shared` there.
- **Load data with `useCachedQuery`** (or `useContent` for `/api/content`). Add the key to `queryKeys` in
  `lib/query-client.ts`. **Every write invalidates** the keys whose data it changed.
- **Show friendly errors**: `friendlyError()` / `authErrorMessage()` from `lib/errors.ts`, `<LoadError>` for failed
  loads. Never render a raw server message. Wrap Better Auth client calls in `try/catch` (it throws on network
  failure).
- **Admin-only UI** goes through `components/admin/lazy.tsx` (role check before download), and every admin
  endpoint uses `requireRole("admin")`.
- **Counters change atomically**: XP updates use a single SQL `UPDATE … xp + n` or a transaction, never
  read-modify-write in JS.
- **Auth flows don't reveal accounts**: the same response and timing whether or not an email is registered.
- **Every page sets its tab title** with `<PageTitle title="…" />`.
- **Use design tokens** (`bg-card`, `text-muted-foreground`, `border`…) and check both light and dark mode, and a
  390 px wide screen.
- Comments explain *why*, not *what*. Match the style of the file you're in (tabs in the frontend, 2 spaces in the
  backend and shared package).

**Git**
- Branch per change (`feat/…`, `fix/…`, `perf/…`, `docs/…`), pull request into `main`. `main` is what deploys.
- Short commit messages: a conventional subject (`feat:`, `fix:`, `perf:`, `docs:`, `chore:`) plus at most a line
  or two of body.
- Update the docs and the changelog (**Unreleased**) in the same PR. See [docs/README.md](README.md#keeping-these-docs-current).

## Recipes

### Add a page under `/home`

1. Create `components/app-<name>-page.tsx` exporting `App<Name>Page`; start it with `<PageTitle title="…" />`.
2. Register it lazily in `HomePage.tsx`:
   `const App<Name>Page = lazyPage(() => import("@/components/app-<name>-page"), "App<Name>Page");`
   and add a `<Route path="<name>" element={<App<Name>Page />} />`.
3. Add it to the navigation: `components/app-sidebar.tsx` and `components/app-navigation-menu.tsx`.

### Add an API endpoint

1. Put the request schema and response type in `packages/shared/src/index.ts`.
2. Add the handler to the matching router in `apps/backend/src/routes/` (or a new router mounted in `src/index.ts`;
   anything under `/api/admin/<word>` must be mounted **before** `app.route("/api/admin", adminContentRouter)`).
   Use `requireAuth` / `requireRole("admin")`, parse the body with `safeParse`, return 400 with `details` on failure.
3. Frontend: call it with `apiGet<T>(path)` / `apiSend<T>(path, method)` (`lib/admin-api.ts`), read it through
   `useCachedQuery(queryKeys.<key>, fetcher)`, and invalidate keys after writes.
4. Document it in [api.md](api.md).

### Add a field to an existing content type

1. `schema.prisma`: add the column with a `@default` (keeps deploys non-destructive) → `bun run db:push`.
2. Shared: add it to the type's zod schema and response type.
3. Backend `lib/content.ts`: include it in the relevant `select`/`include` (list queries select few fields on
   purpose: only add it there if lists need it).
4. Admin editor `components/admin/editors.tsx`: add it to the draft type, `empty()`, `fromItem()` and `Form`.
5. Render it on the page. The lesson `body` (commit "feat: add Markdown body to lessons and extras") is a full
   worked example of these steps.

### Add a new content type

1. Shared: add it to `CONTENT_TYPES` and `ContentSchemas`, plus its response type.
2. Prisma model → `db push`.
3. Backend `lib/content.ts`: add cases to `listContent`, `getContent`, `createContent`, `updateContent`,
   `deleteContent`, `deleteManyContent` (the `switch`es are exhaustive, so TypeScript points at every place).
4. Frontend: `CONTENT` in `lib/content.ts`, an editor in `EDITORS` (`components/admin/editors.tsx`), the dashboard
   tab group in `components/admin/admin-dashboard.tsx`, a list page (`<ContentList type="…" />`), a detail page
   if it isn't external, routes in `HomePage.tsx` and navigation entries.

### Change XP amounts or make another type completable

- Amounts: `COMPLETION_XP` in `packages/shared/src/constants.ts`. Existing completions keep the XP they awarded
  (stored per row), so unticking an old item returns its original amount.
- New completable type: add it to `COMPLETION_XP`, add a `<Type>Completion` model like `ProblemCompletion`, add an
  entry to `tables` in `apps/backend/src/lib/progress.ts`, extend `Progress` (shared) and `getProgress`, then
  place `<DoneCheck type="…" id title />` where the items are listed.

### Add site content (lessons, practice, quizzes)

Write it as a **content pack** in `content/packs/` and load it with `bun run content:import`, instead of only typing
it into the admin panel: it's reviewed in a PR and can be loaded into production and fresh dev databases. Format,
options and a checklist: [content/README.md](../content/README.md).

### Write content for lessons

Lessons are written for **beginners**: students who may have just started programming. Follow the same shape as
the existing packs, so every lesson feels familiar:

1. **Lesson description** (in `pack.json`): what it covers, roughly how long it takes, which lesson comes first.
2. **Before you start**: what the reader should already know, by lesson name.
3. **In this lesson you'll learn to:** 3–5 concrete outcomes.
4. **Sections** (`##`, the page title is the only `#`), each going: the idea in one plain sentence → an
   everyday analogy (a pile of plates, a guessing game) → a short example → a `> [!TRY]` task.
5. **Going further**: details most readers can skip (exact bit sizes, worst cases, advanced sources).
6. **Summary** (5–6 bullets), **Words to know** (each term defined in one line) and **Next steps** (sources,
   the pack's challenges and quiz, the next lesson).

Writing rules:

- **Every ```` ```cpp ```` block is a complete program** (`#include`s and `main`) that compiles and runs as-is, so
  the Copy button gives the reader something they can paste into OnlineGDB and run. Show the output in comments
  (`// prints 5`). Code that *shouldn't* compile goes in a comment (`// int x{ 3.5 };   // the compiler refuses`).
- Explain every new word the first time it appears, in plain language; bold it.
- Prefer tables and step-by-step traces (e.g. how `factorial(3)` runs) to long paragraphs.
- Use callouts on their own line, then the text on the following `>` lines: `> [!TIP]`, `> [!NOTE]`,
  `> [!WARNING]` (common mistakes), `> [!TRY]` (a small exercise the reader can check by running it).
- Link sources inline with normal Markdown links and also list them under Sources.
- Raw HTML is ignored and images show as links.
- Check the lesson still covers every question in the pack's quiz.
- Before publishing, compile and run every block with `g++ -std=c++20 -Wall -Wextra`: no warnings, and the
  output must match the comments.

## Verify a change before pushing

There is no automated test suite in the repo. Run these, in this order:

```sh
bun install --frozen-lockfile          # lockfile matches package.json
bun run typecheck                      # all three workspaces
cd apps/frontend && bun run lint       # oxlint: no errors (a few known warnings exist)
bun run build                          # production build + landing-page prerender must succeed
```

Then click through the change with `RESEND_API_KEY= bun run dev` (emails print to the console):
- the changed pages in light **and** dark mode, and at 390 px width;
- the browser console shows no errors;
- with the backend stopped, the page shows a friendly error with Retry (no hang, no raw message);
- as a non-admin, admin UI is absent; as an admin, it works.

### Rehearse a schema change

Before shipping a schema change, apply it to a throwaway copy of the production schema:

```sh
docker exec rau-postgres psql -U postgres -d rau_db -c "CREATE DATABASE rau_rehearsal;"
URL="postgresql://postgres:postgres@localhost:5432/rau_rehearsal"
git show origin/main:apps/backend/prisma/schema.prisma > /tmp/main.prisma
cd apps/backend
DATABASE_URL=$URL bunx prisma db push --schema /tmp/main.prisma --skip-generate   # today's production schema
# insert a few rows with psql, then apply the new schema on top:
DATABASE_URL=$URL bunx prisma db push --skip-generate                             # must not ask about data loss
docker exec rau-postgres psql -U postgres -d rau_db -c "DROP DATABASE rau_rehearsal;"
```

Use `--skip-generate` so the Prisma client your dev backend uses isn't regenerated for the old schema.

## Gotchas

- **Restart the backend after `db:push`**: the running process keeps the old Prisma client (the dev client is a
  global singleton that survives hot reload).
- **Better Auth `useSession()`** reports `isRefetching: true` even on the very first fetch; use `isPending` plus the
  "settled" logic in `route-guards.tsx`.
- **Vite can miss files replaced in place** (e.g. `sed -i`). If the browser runs stale code, `touch` the file.
- **base-ui `Button render={<Link/>}`** has role `button`, not `link`.
- **Browser automation**: Playwright's `click()` scrolls the element into view first, which breaks
  scroll-restoration tests. Click via `element.click()` in `page.evaluate` there.
- **Lessons and extras share one table** (`Resource.kind`): a change to one affects both.

## Known issues

- `bun run test:auth` fails: it expects sign-up to log the user in, but sign-up requires email confirmation.
  Fails the same way on `main`; the test needs updating.
- XP from done checks is an honor system; admins correct abuse by hand. Admin XP adjustments aren't logged.
- `vite build` warns about two chunks over 500 kB: Shiki's C++ and Emacs Lisp grammars. Both are lazy and only
  load when a lesson shows that language.
- Without JavaScript, every URL shows the prerendered landing copy (all URLs serve the same `index.html`).
- A few oxlint `only-export-components` warnings: they only affect hot reload in dev.
