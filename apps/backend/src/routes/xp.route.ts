import { Hono } from "hono";
import { BulkXpAdjustmentSchema, XpAdjustmentSchema } from "@raudevweb/shared";
import { Prisma } from "@prisma/client";
import { requireAuth, type AuthContext } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { prisma } from "../lib/prisma";

const userXpSelect = { id: true, name: true, email: true, role: true, xp: true } as const;

/** Admin XP management: /api/admin/users */
export const adminXpRouter = new Hono<AuthContext>();
adminXpRouter.use("*", requireAuth, requireRole("admin"));

// GET /api/admin/users — every user, highest XP first
adminXpRouter.get("/", async (c) => {
  const users = await prisma.user.findMany({
    select: userXpSelect,
    orderBy: [{ xp: "desc" }, { name: "asc" }],
  });
  return c.json(users);
});

// POST /api/admin/users/xp { ids, delta } — same adjustment for many users → { count }
adminXpRouter.post("/xp", async (c) => {
  const parsed = BulkXpAdjustmentSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Bad request", details: parsed.error.flatten() }, 400);
  }
  const { ids, delta } = parsed.data;
  const count = await prisma.$executeRaw`
    UPDATE "user"
    SET xp = GREATEST(0, xp + ${delta}), "updatedAt" = NOW()
    WHERE id IN (${Prisma.join(ids)})
  `;
  return c.json({ count });
});

// POST /api/admin/users/:id/xp { delta } — add (+) or deduct (-) XP, never below 0
adminXpRouter.post("/:id/xp", async (c) => {
  const parsed = XpAdjustmentSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Bad request", details: parsed.error.flatten() }, 400);
  }

  const id = c.req.param("id");
  // Single atomic statement, so concurrent adjustments can't overwrite each other
  const updated = await prisma.$executeRaw`
    UPDATE "user"
    SET xp = GREATEST(0, xp + ${parsed.data.delta}), "updatedAt" = NOW()
    WHERE id = ${id}
  `;
  if (updated === 0) return c.json({ error: "Not found" }, 404);

  return c.json(await prisma.user.findUnique({ where: { id }, select: userXpSelect }));
});
