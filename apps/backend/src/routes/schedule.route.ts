import { Hono } from "hono";
import { SessionScheduleSchema } from "@raudevweb/shared";
import { requireAuth, type AuthContext } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { prisma } from "../lib/prisma";

const ID = "default";
const select = {
  title: true,
  weekday: true,
  startTime: true,
  endTime: true,
  location: true,
  note: true,
  semesterStart: true,
  cancelled: true,
  updatedAt: true,
} as const;

/** Returns the schedule, creating the default row (Friday 11:00–14:00) on first use. */
const getSchedule = () => prisma.sessionSchedule.upsert({ where: { id: ID }, create: { id: ID }, update: {}, select });

/** GET /api/schedule — public (also shown on the landing page before login) */
export const scheduleRouter = new Hono<AuthContext>();
scheduleRouter.get("/", async (c) => c.json(await getSchedule()));

/** GET/PUT /api/admin/schedule — admins */
export const adminScheduleRouter = new Hono<AuthContext>();
adminScheduleRouter.use("*", requireAuth, requireRole("admin"));
adminScheduleRouter.get("/", async (c) => c.json(await getSchedule()));
adminScheduleRouter.put("/", async (c) => {
  const parsed = SessionScheduleSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Bad request", details: parsed.error.flatten() }, 400);
  }
  const saved = await prisma.sessionSchedule.upsert({
    where: { id: ID },
    create: { id: ID, ...parsed.data },
    update: parsed.data,
    select,
  });
  return c.json(saved);
});
