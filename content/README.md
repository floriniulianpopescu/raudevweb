# Content packs

Ready-made site content (lessons, practice and quizzes) kept in the repo, so it can be reviewed in pull requests and
loaded into any site (local, production) with one command.

| Pack | Contents |
|---|---|
| [`01-intro-to-cpp`](packs/01-intro-to-cpp/) | Introduction to C++: lesson, extra (C++ Toolbox), 6 exercises, 5 problems, 2 challenges, quiz |
| [`02-intro-to-algorithms`](packs/02-intro-to-algorithms/) | Introduction to Algorithms: lesson, 6 exercises, 5 problems, 2 challenges, quiz |

## Importing

You need an **admin account** on the target site.

```sh
# from the repo root; credentials come from the environment, never from files in the repo
CONTENT_ADMIN_EMAIL=you@example.com CONTENT_ADMIN_PASSWORD='…' \
  bun run content:import -- --api https://api.example.com --dry-run      # preview: what would be added/skipped

CONTENT_ADMIN_EMAIL=you@example.com CONTENT_ADMIN_PASSWORD='…' \
  bun run content:import -- --api https://api.example.com                # import every pack

bun run content:import -- --api http://localhost:3000 content/packs/02-intro-to-algorithms   # just one pack
```

- `--api` defaults to `$CONTENT_API_URL`, then `http://localhost:3000`.
- With no pack folders given, every pack in `content/packs` is imported in folder order. The number prefixes keep
  the teaching order, and the last pack's items become the "newest" on the site.
- **Safe to run again**: items are matched **by title** per type. Existing ones are skipped and never changed (edits made
  in the admin panel are kept); missing ones are created. The output lists `+` added and `=` skipped.
- Every pack is validated with the same rules as the API **before** anything is sent, so a bad file changes
  nothing. If the run stops halfway (e.g. network), just run it again.

Script: [`apps/backend/src/scripts/import-content.ts`](../apps/backend/src/scripts/import-content.ts).

## Pack format

A pack is a folder with a `pack.json` and, optionally, Markdown files for lesson/extra bodies.

```jsonc
{
  "name": "Introduction to Algorithms",
  "problems":  [{ "title": "…", "description": "…", "href": "https://…" }],   // +20 XP when done
  "exercises": [{ "title": "…", "description": "…", "href": "https://…" }],   // +10 XP when done
  "challenges": [{
    "title": "…", "description": "…",
    "problems":  ["<problem title>"],     // by title: from any pack or already on the site
    "exercises": ["<exercise title>"]
  }],
  "quizzes": [{
    "title": "…", "description": "…",
    "questions": [                         // exactly 5, each with exactly 4 answers
      { "question": "…", "answers": ["…", "…", "…", "…"], "correctIndex": 2 }
    ]
  }],
  "lessons": [{
    "title": "…", "description": "…",
    "bodyFile": "lesson.md",              // or "body": "inline Markdown"; both optional
    "links": [{ "title": "…", "description": "…", "href": "https://…" }]   // 1–50 sources
  }],
  "extras": []                             // same shape as lessons
}
```

All sections are optional. Titles must be unique within a type. The limits are the same as in the admin editor
(see `ContentSchemas` in `packages/shared`). For writing the lesson body, see
[Write content for lessons](../docs/development.md#write-content-for-lessons).

## Adding a pack

1. Create `content/packs/NN-name/` with `pack.json` (and `lesson.md`).
2. Check every external link opens and every problem's difficulty matches its description.
3. Compile and run every C++ snippet in the lesson.
4. Try it on your local site: `bun run content:import -- --dry-run content/packs/NN-name`, then without `--dry-run`, and
   look at the pages (light and dark mode).
5. Add it to the table above and to the changelog.

Changing a pack after it has been imported doesn't update existing sites (existing titles are skipped): edit those
items in the admin panel too, or rename the item so it's imported as new.
