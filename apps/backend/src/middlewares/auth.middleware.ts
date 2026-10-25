import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth";

export type SessionUser = typeof auth.$Infer.Session.user;
export type UserSession = typeof auth.$Infer.Session.session;

export type AuthContext = {
  Variables: {
    user: SessionUser;
    session: UserSession;
  };
};

export const requireAuth = createMiddleware<AuthContext>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);

  await next();
});
