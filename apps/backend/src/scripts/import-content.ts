/**
 * Import content packs (content/packs/<name>/pack.json) into a running site through its admin API.
 *
 *   CONTENT_ADMIN_EMAIL=… CONTENT_ADMIN_PASSWORD=… bun run content:import -- [options] [pack dirs…]
 *
 * Options:
 *   --api <url>   backend URL (default: $CONTENT_API_URL or http://localhost:3000)
 *   --dry-run     only print what would be added or skipped
 * With no pack dirs, every pack in content/packs is imported, in alphabetical order.
 *
 * Items are matched by title per content type: existing ones are skipped (never changed), missing ones are
 * created. Running it again is safe. Every pack is validated with the shared schemas before anything is sent.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  ChallengeSchema,
  LinkContentSchema,
  QuizSchema,
  ResourceLinkSchema,
  ResourceSchema,
  type ContentType,
} from "@raudevweb/shared";

const REPO_ROOT = path.resolve(import.meta.dir, "../../../..");
const PACKS_DIR = path.join(REPO_ROOT, "content", "packs");

// --- pack format ----------------------------------------------------------------

const ResourceEntrySchema = z
  .object({
    title: z.string(),
    description: z.string().default(""),
    /** Markdown inline, or a .md file next to pack.json */
    body: z.string().optional(),
    bodyFile: z.string().optional(),
    links: z.array(ResourceLinkSchema),
  })
  .refine((r) => !(r.body && r.bodyFile), { message: "Use either body or bodyFile, not both" });

const PackSchema = z.object({
  name: z.string().min(1),
  problems: z.array(LinkContentSchema).default([]),
  exercises: z.array(LinkContentSchema).default([]),
  /** Problems and exercises are referenced by title (from this pack or already on the site) */
  challenges: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().default(""),
        problems: z.array(z.string()).default([]),
        exercises: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  quizzes: z.array(QuizSchema).default([]),
  lessons: z.array(ResourceEntrySchema).default([]),
  extras: z.array(ResourceEntrySchema).default([]),
});

type Pack = z.infer<typeof PackSchema>;
type LoadedPack = { dir: string; pack: Pack; resources: Record<"lessons" | "extras", unknown[]> };

/** Read and fully validate a pack (including the final API payloads) before anything is sent. */
function loadPack(dir: string): LoadedPack {
  const file = path.join(dir, "pack.json");
  if (!existsSync(file)) throw new Error(`${file} not found`);
  const parsed = PackSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!parsed.success) throw new Error(`${file} is invalid:\n${z.prettifyError(parsed.error)}`);
  const pack = parsed.data;

  for (const type of ["problems", "exercises", "challenges", "quizzes", "lessons", "extras"] as const) {
    const titles = pack[type].map((i) => i.title.trim());
    const dupe = titles.find((t, i) => titles.indexOf(t) !== i);
    if (dupe) throw new Error(`${file}: "${dupe}" appears twice in ${type}`);
  }

  const resources = { lessons: [] as unknown[], extras: [] as unknown[] };
  for (const type of ["lessons", "extras"] as const) {
    for (const { bodyFile, body, ...rest } of pack[type]) {
      const text = bodyFile ? readFileSync(path.join(dir, bodyFile), "utf8") : (body ?? "");
      const payload = ResourceSchema.safeParse({ ...rest, body: text });
      if (!payload.success) throw new Error(`${file}: ${type} "${rest.title}":\n${z.prettifyError(payload.error)}`);
      resources[type].push(payload.data);
    }
  }
  return { dir, pack, resources };
}

// --- API --------------------------------------------------------------------------

class Api {
  private cookie = "";
  constructor(private readonly base: string) {}

  async login(email: string, password: string) {
    const res = await fetch(`${this.base}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(`Login failed (${res.status}): ${await res.text()}`);
    this.cookie = res.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
  }

  async request<T>(method: string, apiPath: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.base}/api/${apiPath}`, {
      method,
      headers: { "Content-Type": "application/json", Cookie: this.cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${method} /api/${apiPath} failed (${res.status}): ${await res.text()}`);
    return res.json() as Promise<T>;
  }
}

// --- import -----------------------------------------------------------------------

const ORDER = ["problems", "exercises", "challenges", "quizzes", "lessons", "extras"] as const;

async function main() {
  const args = process.argv.slice(2);
  let dryRun = false;
  let base = process.env.CONTENT_API_URL ?? "http://localhost:3000";
  const dirs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--api") {
      const url = args[++i];
      if (!url) throw new Error("--api needs a URL");
      base = url;
    } else if (arg.startsWith("--")) throw new Error(`Unknown option ${arg}`);
    else dirs.push(arg);
  }
  const packDirs = (dirs.length ? dirs : readdirSync(PACKS_DIR).sort().map((d) => path.join(PACKS_DIR, d))).map(
    (d) => path.resolve(d),
  );

  const email = process.env.CONTENT_ADMIN_EMAIL;
  const password = process.env.CONTENT_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set CONTENT_ADMIN_EMAIL and CONTENT_ADMIN_PASSWORD (an admin account)");

  const packs = packDirs.map(loadPack); // validate everything first
  console.log(`${dryRun ? "Dry run against" : "Importing into"} ${base}: ${packs.map((p) => p.pack.name).join(", ")}\n`);

  const api = new Api(base.replace(/\/+$/, ""));
  await api.login(email, password);

  // title → id of what's on the site (and what this run creates)
  const ids = {} as Record<ContentType, Map<string, string>>;
  for (const type of ORDER) {
    const items = await api.request<{ id: string; title: string }[]>("GET", `admin/${type}`);
    ids[type] = new Map(items.map((i) => [i.title.trim(), i.id]));
  }

  const counts = { added: 0, skipped: 0 };
  for (const { pack, resources } of packs) {
    console.log(`▸ ${pack.name}`);
    for (const type of ORDER) {
      const entries: { title: string }[] =
        type === "lessons" || type === "extras" ? (resources[type] as { title: string }[]) : pack[type];
      for (const entry of entries) {
        const title = entry.title.trim();
        if (ids[type].has(title)) {
          console.log(`  = ${type.padEnd(10)} ${title} (already there, skipped)`);
          counts.skipped++;
          continue;
        }

        let payload: unknown = entry;
        if (type === "challenges") {
          const c = entry as Pack["challenges"][number];
          const resolve = (kind: "problems" | "exercises", t: string) => {
            const id = ids[kind].get(t.trim());
            if (!id) throw new Error(`Challenge "${title}": ${kind.slice(0, -1)} "${t}" isn't in any pack or on the site`);
            return id;
          };
          payload = ChallengeSchema.parse({
            title: c.title,
            description: c.description,
            problemIds: c.problems.map((t) => resolve("problems", t)),
            exerciseIds: c.exercises.map((t) => resolve("exercises", t)),
          });
        }

        if (dryRun) {
          ids[type].set(title, `(new) ${title}`); // so challenges in this run can reference it
        } else {
          const created = await api.request<{ id: string }>("POST", `admin/${type}`, payload);
          ids[type].set(title, created.id);
        }
        console.log(`  + ${type.padEnd(10)} ${title}${dryRun ? " (would add)" : ""}`);
        counts.added++;
      }
    }
  }

  console.log(`\n${dryRun ? "Would add" : "Added"} ${counts.added}, skipped ${counts.skipped} already on the site.`);
}

main().catch((err: Error) => {
  console.error(`\n✖ ${err.message}`);
  process.exit(1);
});
