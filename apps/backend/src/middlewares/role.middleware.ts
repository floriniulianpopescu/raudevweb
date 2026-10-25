import { createMiddleware } from "hono/factory";
import type { AuthContext } from "./auth.middleware";

export const requireRole = (allowedRole: string) => {
  return createMiddleware<AuthContext>(async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
    }

    if (user.role !== allowedRole) {
      return c.json({ error: "Forbidden", message: `Requires ${allowedRole} role` }, 403);
    }

    await next();
  });
};
