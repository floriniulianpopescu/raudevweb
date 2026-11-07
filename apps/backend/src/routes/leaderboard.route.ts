import { Hono } from "hono";
import {
  LEADERBOARD_DEFAULT_LIMIT,
  LEADERBOARD_MAX_LIMIT,
  type LeaderboardEntry,
  type LeaderboardResponse,
} from "@raudevweb/shared";
import { requireAuth, type AuthContext } from "../middlewares/auth.middleware";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

// Only confirmed (email-verified), non-banned users appear on the leaderboard and count toward ranks.
// `banned` is nullable: list false/null explicitly, since SQL `NOT (banned = true)` also drops NULL rows.
const visible: Prisma.UserWhereInput = {
  emailVerified: true,
  OR: [{ banned: false }, { banned: null }],
};
const publicSelect = { id: true, name: true, image: true, xp: true } as const;

/** Public leaderboard for signed-in users: /api/leaderboard?limit=50 */
export const leaderboardRouter = new Hono<AuthContext>();
leaderboardRouter.use("*", requireAuth);

leaderboardRouter.get("/", async (c) => {
  const requested = Number(c.req.query("limit") ?? LEADERBOARD_DEFAULT_LIMIT);
  const limit = Number.isInteger(requested)
    ? Math.min(Math.max(requested, 1), LEADERBOARD_MAX_LIMIT)
    : LEADERBOARD_DEFAULT_LIMIT;

  const [top, totalUsers, meRow] = await Promise.all([
    prisma.user.findMany({
      where: visible,
      select: publicSelect,
      orderBy: [{ xp: "desc" }, { name: "asc" }],
      take: limit,
    }),
    prisma.user.count({ where: visible }),
    prisma.user.findFirst({ where: { id: c.get("user").id, ...visible }, select: publicSelect }),
  ]);

  // Competition ranking within the page: same XP → same rank
  const entries: LeaderboardEntry[] = [];
  top.forEach((u, i) => {
    const prev = entries[i - 1];
    const rank = prev && prev.xp === u.xp ? prev.rank : i + 1;
    entries.push({ ...u, rank });
  });

  let me: LeaderboardEntry | null = entries.find((e) => e.id === meRow?.id) ?? null;
  if (meRow && !me) {
    const ahead = await prisma.user.count({ where: { ...visible, xp: { gt: meRow.xp } } });
    me = { ...meRow, rank: ahead + 1 };
  }

  return c.json({ entries, me, totalUsers } satisfies LeaderboardResponse);
});
