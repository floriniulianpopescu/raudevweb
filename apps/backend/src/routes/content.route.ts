import { Hono, type Context } from "hono";
import { Prisma } from "@prisma/client";
import {
  BulkDeleteSchema,
  CONTENT_TYPES,
  ContentSchemas,
  QuizSubmissionSchema,
  type ContentType,
} from "@raudevweb/shared";
import { requireAuth, type AuthContext } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import {
  NotFoundError,
  createContent,
  deleteContent,
  deleteManyContent,
  getContent,
  gradeQuiz,
  listContent,
  updateContent,
} from "../lib/content";

const isContentType = (t: string): t is ContentType =>
  (CONTENT_TYPES as readonly string[]).includes(t);

const notFound = (c: Context) => c.json({ error: "Not found" }, 404);

/** Validate the :type param and the JSON body against ContentSchemas[type]. */
async function parseBody(c: Context, type: ContentType) {
  const body = await c.req.json().catch(() => null);
  return ContentSchemas[type].safeParse(body);
}

function handleError(err: Error, c: Context) {
  if (err instanceof NotFoundError) return notFound(c);
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: record (or a record to connect) not found
    if (err.code === "P2025") return notFound(c);
  }
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
}

// ---------------------------------------------------------------------------
// Public (signed-in users): /api/content
// ---------------------------------------------------------------------------

export const contentRouter = new Hono<AuthContext>();
contentRouter.use("*", requireAuth);
contentRouter.onError(handleError);

// GET /api/content/:type?limit=3 — newest first; limit is optional (1–100)
contentRouter.get("/:type", async (c) => {
  const type = c.req.param("type");
  if (!isContentType(type)) return notFound(c);
  const raw = c.req.query("limit");
  const n = raw === undefined ? undefined : Number(raw);
  const limit = n !== undefined && Number.isInteger(n) ? Math.min(Math.max(n, 1), 100) : undefined;
  return c.json(await listContent(type, false, limit));
});

contentRouter.get("/:type/:id", async (c) => {
  const type = c.req.param("type");
  if (!isContentType(type)) return notFound(c);
  const item = await getContent(type, c.req.param("id"));
  return item ? c.json(item) : notFound(c);
});

contentRouter.post("/quizzes/:id/submit", async (c) => {
  const parsed = QuizSubmissionSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Bad request", details: parsed.error.flatten() }, 400);
  }
  const result = await gradeQuiz(c.req.param("id"), parsed.data);
  return result ? c.json(result) : notFound(c);
});

// ---------------------------------------------------------------------------
// Admin CRUD: /api/admin
// ---------------------------------------------------------------------------

export const adminContentRouter = new Hono<AuthContext>();
adminContentRouter.use("*", requireAuth, requireRole("admin"));
adminContentRouter.onError(handleError);

adminContentRouter.get("/:type", async (c) => {
  const type = c.req.param("type");
  if (!isContentType(type)) return notFound(c);
  return c.json(await listContent(type, true));
});

adminContentRouter.get("/:type/:id", async (c) => {
  const type = c.req.param("type");
  if (!isContentType(type)) return notFound(c);
  const item = await getContent(type, c.req.param("id"), true);
  return item ? c.json(item) : notFound(c);
});

adminContentRouter.post("/:type", async (c) => {
  const type = c.req.param("type");
  if (!isContentType(type)) return notFound(c);
  const parsed = await parseBody(c, type);
  if (!parsed.success) {
    return c.json({ error: "Bad request", details: parsed.error.flatten() }, 400);
  }
  return c.json(await createContent(type, parsed.data), 201);
});

// POST /api/admin/:type/bulk-delete { ids } → { count }
adminContentRouter.post("/:type/bulk-delete", async (c) => {
  const type = c.req.param("type");
  if (!isContentType(type)) return notFound(c);
  const parsed = BulkDeleteSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Bad request", details: parsed.error.flatten() }, 400);
  }
  const { count } = await deleteManyContent(type, parsed.data.ids);
  return c.json({ count });
});

adminContentRouter.patch("/:type/:id", async (c) => {
  const type = c.req.param("type");
  if (!isContentType(type)) return notFound(c);
  const parsed = await parseBody(c, type);
  if (!parsed.success) {
    return c.json({ error: "Bad request", details: parsed.error.flatten() }, 400);
  }
  return c.json(await updateContent(type, c.req.param("id"), parsed.data));
});

adminContentRouter.delete("/:type/:id", async (c) => {
  const type = c.req.param("type");
  if (!isContentType(type)) return notFound(c);
  await deleteContent(type, c.req.param("id"));
  return c.body(null, 204);
});
