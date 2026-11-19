import { Hono } from "hono";
import { COMPLETION_XP, type CompletableType } from "@raudevweb/shared";
import { requireAuth, type AuthContext } from "../middlewares/auth.middleware";
import { ItemNotFoundError, getProgress, markDone, markUndone } from "../lib/progress";

const isCompletable = (t: string): t is CompletableType => Object.hasOwn(COMPLETION_XP, t);

/** The signed-in user's "done" ticks: /api/progress */
export const progressRouter = new Hono<AuthContext>();
progressRouter.use("*", requireAuth);
progressRouter.onError((err, c) => {
  if (err instanceof ItemNotFoundError) return c.json({ error: "Not found" }, 404);
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

// GET /api/progress → { problems: { ids, xp }, exercises: { ids, xp } }
progressRouter.get("/", async (c) => c.json(await getProgress(c.get("user").id)));

// PUT /api/progress/:type/:id → tick as done (+XP); DELETE → untick (−XP)
progressRouter.put("/:type/:id", async (c) => {
  const type = c.req.param("type");
  if (!isCompletable(type)) return c.json({ error: "Not found" }, 404);
  return c.json(await markDone(type, c.req.param("id"), c.get("user").id));
});

progressRouter.delete("/:type/:id", async (c) => {
  const type = c.req.param("type");
  if (!isCompletable(type)) return c.json({ error: "Not found" }, 404);
  return c.json(await markUndone(type, c.req.param("id"), c.get("user").id));
});
