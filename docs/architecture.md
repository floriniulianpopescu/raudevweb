# Architecture

## Overview

```
Browser ── React SPA (Cloudflare Pages) ──HTTPS + cookies──▶ Hono API (VPS, systemd "raudev-api") ──▶ PostgreSQL
                                                                 │
                                                                 └──▶ Resend (emails)
```

- The **frontend** is a single-page app: one `index.html`, all routing in the browser. Cloudflare Pages serves
  `index.html` for every unknown path (SPA mode, because there is no `404.html`).
- The **backend** is a separate origin. Auth uses Better Auth session **cookies**, so every request is sent with
  `credentials: "include"` and the backend's CORS allows exactly one origin (`CORS_ORIGIN`).
- **Shared code** (zod schemas, types, constants) lives in `packages/shared` and is imported by both sides as
  `@raudevweb/shared`. Validation rules are written once and enforced on both ends.

## Monorepo layout

Bun workspaces (`package.json` → `workspaces: ["apps/*", "packages/*"]`).

```
apps/
  backend/                Hono API
    prisma/schema.prisma  database schema (applied with `prisma db push`, no migration files)
    src/index.ts          app setup: CORS, Better Auth handler, route mounting
    src/lib/              auth (Better Auth config), prisma client, email, content + progress data access
    src/middlewares/      requireAuth, requireRole
    src/routes/           one file per area: content, progress, leaderboard, schedule, xp (admin users), user
    docker-compose.yml    local PostgreSQL ("rau-postgres", port 5432)
  frontend/               React 19 + Vite + Tailwind 4 + base-ui (shadcn style)
    index.html            meta/Open Graph tags, no-flash theme script, prerender marker
    scripts/prerender.mjs build step: renders the landing page into dist/index.html
    public/               static files (favicon, og-image.png, robots.txt, staff photos)
    src/main.tsx          React root + TanStack Query provider
    src/App.tsx           top-level routes (data router), lazy page loading
    src/HomePage.tsx      signed-in shell (sidebar + header) and the /home/* routes
    src/*Page.tsx         guest pages: landing (FirstPage), login, signup, forgot, reset, verify-email
    src/components/       pages and UI; admin/ (dashboards), home/ (cards on /home), markdown/, ui/ (primitives)
    src/lib/              API client, query cache, auth client, errors, progress, schedule, theme helpers
packages/
  shared/src/index.ts     zod schemas + API types (pulls in zod)
  shared/src/constants.ts zod-free constants (importable from the landing page without zod)
deploy.sh                 backend deploy script (run on the VPS)
```

## Backend

- **Hono** app in `src/index.ts`. Routers are mounted under `/api/...`; see [api.md](api.md).
  `/api/admin/users` and `/api/admin/schedule` must stay mounted **before** `/api/admin` because the generic
  admin content router matches `/:type`.
- **Auth**: Better Auth (`src/lib/auth.ts`) handles everything under `/api/auth/*` (sign-up, sign-in, sessions,
  email verification, password reset). Plugins: `admin` (role + ban fields on the user) and `bearer`.
- **Guards**: `requireAuth` loads the session into `c.get("user")`; `requireRole("admin")` checks `user.role`.
  Admin endpoints always enforce the role on the server: hiding UI is never the protection.
- **Data access**: Prisma 6 (`src/lib/prisma.ts`, a global singleton in dev so hot reload doesn't open new pools).
  Logic that spans several statements runs in `prisma.$transaction` (e.g. XP for completions).
- **Validation**: request bodies are parsed with the shared zod schemas; failures return
  `400 { error: "Bad request", details }`.
- **Emails**: `src/lib/email.ts` sends through Resend, or prints to the console when `RESEND_API_KEY` is empty.

## Frontend

### Routing

- `App.tsx` uses a **data router** (`createBrowserRouter`) with one catch-all route that renders the existing
  `<Routes>` tree. The data router is what enables `<ScrollRestoration>` and the route `errorElement`
  (`RouteError`: a "Something went wrong / Reload" page instead of a blank screen).
- `/home/*` is wrapped in `ProtectedRoute`; guest pages in `GuestRoute` (`components/route-guards.tsx`).
  Guards wait for the **first** session check before redirecting, so a hard refresh on a deep link keeps the page.
  Login sends you back to the page you asked for (`lib/redirect.ts`, only `/home…` paths are accepted).
- Unknown paths show a 404: `NotFoundPage` outside `/home`, `NotFoundView` inside the `/home` layout and for
  missing items (API 404).

### Code splitting

- Only the landing page (`FirstPage`) is in the main bundle. Every other page is loaded on first visit with
  `lazyPage(() => import("./X"), "X")` (`lib/lazy-page.ts`).
- If a page's file is missing (typically: a new deploy replaced it while a tab was open), `lazyPage` reloads the
  page **once** (at most once per 10 s) to fetch the new version; otherwise the route error page shows.
- Admin panels are imported from `components/admin/lazy.tsx`, which checks `role === "admin"` **before**
  rendering the lazy component, so other users never download admin code.
- The Markdown renderer and Shiki (syntax highlighting) load only on pages that show a lesson body; each Shiki
  language grammar is its own chunk, fetched when a code block in that language appears.

### Data loading and caching (TanStack Query)

- `lib/query-client.ts` holds the single `queryClient`, the **query keys** and `useCachedQuery`.
  - `staleTime` 30 s: revisiting a page within 30 s shows cached data with no request; after that it shows the
    cached data and refreshes in the background.
  - One automatic retry for network errors and 5xx; none for 4xx (a 404 shows immediately).
  - `useCachedQuery` returns `{ data, error, retry }`: `error` is only set when there is **no** data to show
    (a failed background refresh keeps the cached page); `retry()` re-runs **every** failed query on the page.
- `useContent(path)` (`components/content-list.tsx`) is `useCachedQuery` for `/api/content/<path>`.
- **Invalidation**: whatever writes data invalidates the matching key. Admin managers invalidate
  `queryKeys.content()`, `.leaderboard` or `.schedule` after saving; done checks invalidate `.progress` and
  `.leaderboard`.
- `SessionCacheGuard` clears the whole cache on logout or when a different account logs in.
- Admin dashboards (`components/admin/*-manager.tsx`) deliberately fetch fresh data themselves instead of using
  the cache.

### Errors

- API calls go through `lib/admin-api.ts` (`apiGet`, `apiSend`, `contentApi`, `adminApi`), which throw `ApiError`
  (with `status`) on non-2xx responses and `TypeError` when the server can't be reached.
- `lib/errors.ts` turns those into user-facing text: `friendlyError(e, fallback)` and
  `authErrorMessage(error, fallback)` (for Better Auth results). Never show raw `error.message` from the server.
- Better Auth's client **throws** on network failure instead of calling `onError`: wrap its calls in `try/catch`
  (see `LoginPage.tsx`).
- Load failures render `<LoadError onRetry={retry} />`.

### Prerendered landing page and SEO

- `bun run build` runs `scripts/prerender.mjs` after `vite build`: it SSR-renders `src/entry-prerender.tsx`
  (the landing page) and inserts the HTML into `dist/index.html` as `<div id="prerender">`.
- Crawlers and link-preview bots see real content. In the browser, `index.html` hides the copy on every URL
  except `/`, and `lib/prerender.ts → removePrerender()` removes it as soon as React draws a real page.
- `index.html` has the description and Open Graph tags; `vite.config.ts` makes the preview image URL absolute
  when `VITE_SITE_URL` is set. `public/robots.txt` keeps crawlers out of `/home`.

### Styling and theme

- Tailwind 4 with design tokens in `src/index.css` (`:root` and `.dark`). Use tokens (`bg-card`,
  `text-muted-foreground`, `text-primary`…) instead of raw colours.
- The theme (light/dark/system) is applied by an inline script in `index.html` before first paint; keep it in sync
  with `lib/theme.ts`.
- UI primitives in `components/ui/` are base-ui components in shadcn style. A `Button` with `render={<Link/>}` has
  role `button`, not `link` (matters for tests).
- Every page sets its tab title with `<PageTitle title="…" />` → "… · RAUDEV".
