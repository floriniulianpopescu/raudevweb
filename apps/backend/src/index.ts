import { Hono } from "hono";
import { cors } from "hono/cors";
import { HealthCheckResponseSchema } from "@raudevweb/shared";
import { auth } from "./lib/auth";
import { userRouter } from "./routes/user.route";

const app = new Hono();

// CORS configuration for cross-origin frontend support with cookies
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Set-Cookie"],
    maxAge: 600,
  })
);
// Better Auth API endpoint handler
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Protected & user-related API routes
app.route("/api/user", userRouter);

// Health check endpoint
app.get("/health", (c) => {
  const data = HealthCheckResponseSchema.parse({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
  return c.json(data);
});

// Root welcome endpoint
app.get("/", (c) => {
  return c.json({
    message: "Raudevweb Backend API",
    docs: "/api/auth/reference",
    health: "/health",
  });
});

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
};
