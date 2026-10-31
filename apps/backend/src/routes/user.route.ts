import { Hono } from "hono";
import { UpdateProfileInputSchema } from "@raudevweb/shared";
import { requireAuth, type AuthContext } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { prisma } from "../lib/prisma";
import { error } from "node:console";

export const userRouter = new Hono<AuthContext>();

// GET /me - Returns the current authenticated user and session
userRouter.get("/me", requireAuth, (c) => {
  const user = c.get("user");
  const session = c.get("session");
  return c.json({
    user,
    session,
  });
});

// PATCH /me - Update current user profile
userRouter.patch("/me", requireAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => (null));
  const parsed = UpdateProfileInputSchema.safeParse(body);

  if (!parsed.success) {
    return c.json ({
        error: "Bad request",
        message: "Invalid profile data",
        details: parsed.error.flatten(),
      },
      400
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  return c.json({
    message: "Profile updated successfully",
    user: updatedUser,
  });
});

// GET /admin/dashboard - Requires admin role
userRouter.get("/admin/dashboard", requireAuth, requireRole("admin"), async (c) => {
  const totalUsers = await prisma.user.count();
  const totalSessions = await prisma.session.count();

  return c.json({
    message: "Admin access granted",
    stats: {
      totalUsers,
      totalSessions,
    },
  });
});
