# raudevweb

Website for RAUDEV, the software engineering student club at the Romanian-American University.

Bun monorepo:

| Path | What | Dev URL |
|---|---|---|
| `apps/backend` | API: Hono + Better Auth + Prisma (PostgreSQL) | http://localhost:3000 |
| `apps/frontend` | React + Vite + Tailwind | http://localhost:5173 |
| `packages/shared` | Shared types and zod schemas (`@raudevweb/shared`) | — |

**Developer docs:** [docs/](docs/README.md) covers architecture, features, the API, the data model, how-to recipes
and deployment. Changes are tracked in [CHANGELOG.md](CHANGELOG.md). Ready-made site content lives in
[content/](content/README.md).

## Prerequisites

- [Bun](https://bun.sh) 1.x
- Docker with Compose (for the local PostgreSQL)

## Run it in dev

```sh
# 1. Install dependencies (from the repo root)
bun install

# 2. Start PostgreSQL (container "rau-postgres" on port 5432)
docker compose -f apps/backend/docker-compose.yml up -d

# 3. Configure the backend
cp apps/backend/.env.example apps/backend/.env
#    then set BETTER_AUTH_SECRET to a random string of 32+ characters, e.g.:
#    openssl rand -base64 32

# 4. Create the database tables
cd apps/backend && bun run db:push && cd ../..

# 5. Start backend + frontend together
bun run dev
```

Open http://localhost:5173.

To run just one side: `bun run dev:backend` or `bun run dev:frontend`.

### Environment variables

Backend (`apps/backend/.env`):

| Variable | Dev value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/rau_db` | Matches `apps/backend/docker-compose.yml` |
| `BETTER_AUTH_SECRET` | random, 32+ chars | Signs session cookies |
| `BETTER_AUTH_URL` | `http://localhost:3000` | The backend's own URL |
| `CORS_ORIGIN` | `http://localhost:5173` | The frontend's URL (cookies are cross-origin) |
| `PORT` | `3000` | |
| `RESEND_API_KEY` | *(empty)* | **Leave empty in dev.** Emails are then printed to the backend console instead of being sent |
| `EMAIL_FROM` | `RAUDEV <onboarding@resend.dev>` | Only used when `RESEND_API_KEY` is set |

Frontend (build-time, so no `.env` is needed in dev):

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Backend URL |
| `VITE_SITE_URL` | — | Public site URL, e.g. `https://example.com`. Makes the link-preview image URL absolute and adds `og:url`; set it in production |

### Signing up locally

New accounts must confirm their email before they can log in. With `RESEND_API_KEY` empty, the confirmation email is
printed to the terminal running the backend as an `[EMAIL] To: ...` line. Open the `.../api/auth/verify-email?token=...`
link from it in your browser: the account is verified and you land on `/home` already logged in.

Tip: to keep a real `RESEND_API_KEY` in `.env` but still print emails locally, start with `RESEND_API_KEY= bun run dev`.

To make an account an admin (admin dashboards, content editing):

```sh
docker exec rau-postgres psql -U postgres -d rau_db \
  -c "update \"user\" set role = 'admin' where email = 'you@example.com';"
```

Log out and back in afterwards.

## Useful commands

| Command | Where | What |
|---|---|---|
| `bun run typecheck` | root | Type-check all workspaces |
| `bun run db:push` | `apps/backend` | Apply `prisma/schema.prisma` to the database |
| `bun run db:generate` | `apps/backend` | Regenerate the Prisma client |
| `bun run db:studio` | `apps/backend` | Browse the database in Prisma Studio |
| `bun run content:import` | root | Load the content packs (lessons, practice, quizzes) into a site; see [content/README.md](content/README.md) |
| `bun run test:auth` | `apps/backend` | Auth smoke test (sign-up, session, protected route). Currently out of date, see [known issues](docs/development.md#known-issues) |
| `bun run lint` | `apps/frontend` | Lint with oxlint |
| `bun run build` | `apps/frontend` | Production build; also prerenders the landing page into `dist/index.html` |
| `docker compose down` | `apps/backend` | Stop PostgreSQL (data is kept in the `postgres_data` volume) |

After pulling changes that touch `prisma/schema.prisma`, run `bun install` and `bun run db:push` again.
If `db:push` warns about data loss, read what it wants to drop before passing `--accept-data-loss`.

## Deployment

- **Frontend:** Cloudflare Pages rebuilds on every push to `main`. Set `VITE_SITE_URL` in the Pages build settings so link previews work.
- **Backend:** run `deploy.sh` on the VPS. It pulls `main`, installs dependencies, updates the DB schema and restarts the API.

Details, release checklist and rollback: [docs/deployment.md](docs/deployment.md).
