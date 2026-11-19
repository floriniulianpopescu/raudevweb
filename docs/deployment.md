# Deployment

Production has two independent parts. Both deploy from `main`.

## Frontend: Cloudflare Pages

- Rebuilds automatically on every push to `main`.
- **Check the Pages build command runs the frontend's package script** (`bun run build` in `apps/frontend`), not
  plain `vite build`. The script also prerenders the landing page into `dist/index.html`; with plain `vite build`
  the site still works, but crawlers and link previews get an empty page. The output is `apps/frontend/dist`.
- Build-time environment variables (set in the Pages project settings):

| Variable | Value | Why |
|---|---|---|
| `VITE_API_URL` | the backend's public URL | API calls and auth |
| `VITE_SITE_URL` | the site's public URL, e.g. `https://example.com` | absolute link-preview image + `og:url`. Without it previews may show no image. A malformed value fails the build on purpose. |

- SPA routing relies on Pages' default SPA mode: there must be **no `404.html`** in `public/`, so unknown paths serve
  `index.html` and the app shows its own 404.
- After a deploy, open tabs may request old code files; the app reloads itself once to pick up the new version.

## Backend: VPS

- Runs as the systemd service **`raudev-api`** from a clone at `~/raudevweb`.
- Deploy by running `~/raudevweb/deploy.sh` (or `~/deploy.sh` if symlinked) on the VPS. It:
  1. checks out and fast-forwards `main`;
  2. `bun install --frozen-lockfile`;
  3. `prisma generate` and **`prisma db push`** (stops instead of deleting data if a change is destructive);
  4. restarts `raudev-api` and waits for `GET /health` (prints the last log lines if it doesn't come up).
- Environment: `apps/backend/.env` on the VPS. Same variables as in dev (see the root README), with production
  values: `CORS_ORIGIN` = the site URL, `BETTER_AUTH_URL` = the API URL, a real `RESEND_API_KEY` and `EMAIL_FROM`.

## Loading content

Content (lessons, practice, quizzes) lives in the database, not in the code, so a deploy doesn't add it. Load the
packs from `content/packs` into production with an admin account (dry run first):

```sh
CONTENT_ADMIN_EMAIL=… CONTENT_ADMIN_PASSWORD='…' bun run content:import -- --api <production API URL> --dry-run
CONTENT_ADMIN_EMAIL=… CONTENT_ADMIN_PASSWORD='…' bun run content:import -- --api <production API URL>
```

It only adds items whose titles aren't on the site yet. Details: [content/README.md](../content/README.md).

## Release checklist

1. Everything in [Verify a change before pushing](development.md#verify-a-change-before-pushing) passes.
2. Schema changed? [Rehearse it](development.md#rehearse-a-schema-change) against the production schema.
3. The changelog's **Unreleased** section lists the changes and any **Deploy notes**. Rename it to the release
   date when merging.
4. Merge the PR into `main` → Pages rebuilds the frontend.
5. Run `deploy.sh` on the VPS. The frontend and backend deploy separately, so make backend changes
   backward-compatible with the previous frontend (add endpoints/fields, don't remove them in the same release).
6. Smoke test production: landing page, login, a list page, a lesson, the leaderboard, one done check.

## Rolling back

- **Frontend**: in Cloudflare Pages, roll back to the previous deployment.
- **Backend**: revert the commit on `main` and run `deploy.sh` again. Schema changes are additive by convention, so
  the older code keeps working with the newer tables/columns; nothing needs to be dropped.
