# Changelog

All notable changes to the RAUDEV site. Newest first.

How to use it: add a line under **Unreleased** in the same PR as the change, grouped as Added / Changed / Fixed /
Removed. List anything the person deploying must do under **Deploy notes**. When the PR is merged and deployed,
rename **Unreleased** to that date and start a new empty one.

## Unreleased

Branches `feat/completion-xp`, then `content/intro-algorithms` and `content/data-types` stacked on it, not yet merged into `main`.

### Added
- **Content packs** in `content/packs` and `bun run content:import`, which loads them into any site through the
  admin API (validates first, skips titles that already exist, `--dry-run`). Packs: **Introduction to C++** (the
  existing lesson, extra, 11 practice items, 2 challenges and quiz) and the new **Introduction to Algorithms**
  (lesson on Big-O, searching, sorting and recursion; 6 exercises from CSES, HackerRank and LeetCode; 5 Codeforces
  problems rated 800–1100; challenges "Algorithms: Searching" and "Algorithms: Sorting & Recursion"; a quiz).
- **Data Types in C++** pack, placed between the C++ and Algorithms packs: lesson on integer ranges and overflow,
  `long long` and unsigned, integer division, floating-point precision, chars and ASCII, conversions, `auto` and
  `std::string`; 6 exercises (HackerRank, CSES, LeetCode); 5 Codeforces problems rated 800–1000 where the right
  type is the trap; challenges "Data Types: Numbers" and "Data Types: Characters & Strings"; a quiz.
- **Done checks with automatic XP.** Every problem and exercise can be ticked as done on the Problems/Exercises
  lists, challenge pages and the home "Latest" cards: problems give 20 XP, exercises 10. Unticking takes the XP
  back. Progress lines ("7 / 20 done · 140 XP earned") on lists and challenges; admins see "N completed" per item.
- **Lesson and extra body.** An optional Markdown article between the description and the sources, with
  syntax-highlighted code blocks (language label + Copy), tables and Tip/Note/Warning callouts. Admin editor with
  Write / Preview tabs. The "Bibliography" heading is now "Sources".
- **Link previews and SEO.** Page description, Open Graph/Twitter tags with a 1200×630 preview image,
  `robots.txt`, and a prerendered landing page so crawlers see real content.
- **404 pages** for unknown URLs (standalone and inside `/home`) and for missing items.
- **Tab titles** on every page ("Lessons · RAUDEV").
- **Error page** with a Reload button when a page crashes or its code can't be downloaded.
- Developer docs in `docs/`, this changelog, and the root README with local setup.

### Changed
- **Faster first load.** Pages and admin panels load on demand; the first download dropped from 689 kB to
  419 kB (218 → 138 kB gzipped). Admin code is only downloaded by admins.
- **Instant navigation.** API data is cached (TanStack Query): going back shows the page immediately, with a
  background refresh. Admin edits refresh every affected page, including the home "Latest" cards. The cache is
  cleared on logout.
- **Scroll position** is restored on Back/Forward; new pages start at the top.
- **Retry** reloads every failed card on the page, not just the one clicked; network errors and server errors get
  one automatic retry first.

### Fixed
- Refreshing or opening a link to a `/home/...` page no longer bounces to `/login` and back to `/home`.
- Login, sign-up, forgot/reset password, resend-email and Settings (username, logout) no longer hang when the
  server can't be reached; they show a clear message. A server error on login no longer says "Invalid email or
  password".
- Lists, detail pages, home cards, leaderboard, session card, quiz submit and admin panels show friendly errors
  with Retry instead of raw server responses.
- Removed a nested `<main>` landmark on `/home` pages.
- README: PostgreSQL is started from `apps/backend` (where `docker-compose.yml` lives).

### Deploy notes
- **Database**: adds `resource.body` (default `""`) and the tables `problem_completion` and
  `exercise_completion`. All additive; `deploy.sh` applies them with `prisma db push`. Rehearsed against the
  current production schema with data: no data-loss prompts, all rows kept.
- **Cloudflare Pages**: set `VITE_SITE_URL` to the site's public URL, and check that the build command runs
  `bun run build` in `apps/frontend` (it includes the prerender step).
- **Content**: production doesn't have the lessons and practice yet. After deploying, load them with
  `bun run content:import` (see `content/README.md`); dry-run first.
- New frontend dependencies: `@tanstack/react-query`, `react-markdown`, `remark-gfm`, `shiki` (lockfile updated).

## 2026-11-08
- Settings page redesign (account and session sections, change-username dialog); new logo for light and dark
  themes; favicon. (#14)

## 2026-11-07
- Only email-confirmed users appear on the leaderboard. (#13)
- New accounts must confirm their email before logging in; confirmation and "already registered" emails;
  logging in while unconfirmed sends a fresh link. (#10–#12)
- `deploy.sh` for the VPS backend; frontend built with `VITE_API_URL`. (#9)
- Password reset from Settings; zod upgraded to v4. (#8)

## 2026-11-04
- Content system (challenges, problems, exercises, quizzes, lessons, extras), admin dashboards, leaderboard
  with admin XP management, weekly session schedule, and dark mode. (#7)

## 2026-11-01
- Password reset emails sent through Resend. (#5, #6)

## 2026-10-31
- Forgot / reset password pages; hardened password reset; names validated on the server; zod schemas for
  sign-in, sign-up and profile updates. (#3, #4)

## 2026-10-26
- Sign-up and login pages, including mobile layout.

## 2026-10-25
- Better Auth with PostgreSQL and Prisma; first version of the landing page. (#1, #2)

## 2026-10-23
- Project started.
