import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { bearer, admin } from "better-auth/plugins";
import { SignUpInputSchema } from "@raudevweb/shared";
import { prisma } from "./prisma";

// Better Auth endpoints that accept a user-supplied name
const NAME_PATHS = ["/sign-up/email", "/update-user"];

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [process.env.CORS_ORIGIN || "http://localhost:5173"],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword(data) {
      console.log(`[AUTH] Password reset requested for ${data.user.email}: ${data.url}`);
    },
    // Invalidate any other pending reset links once the password has been changed
    async onPasswordReset({ user }) {
      await prisma.verification.deleteMany({
        where: { value: user.id, identifier: { startsWith: "reset-password:" } },
      });
    },
  },
  hooks: {
    // Enforce the shared name rules server-side (Better Auth only checks that name is a string)
    before: createAuthMiddleware(async (ctx) => {
      if (!NAME_PATHS.includes(ctx.path)) return;
      // update-user is a partial update: only validate name when it is sent
      if (ctx.path === "/update-user" && ctx.body?.name === undefined) return;

      const result = SignUpInputSchema.shape.name.safeParse(ctx.body?.name);
      if (!result.success) {
        throw new APIError("BAD_REQUEST", {
          code: "INVALID_NAME",
          message: result.error.issues[0]?.message ?? "Invalid name",
        });
      }
    }),
  },
  plugins: [
    bearer(),
    admin({
      defaultRole: "user",
      adminRole: "admin",
    }),
  ],
});

export type Auth = typeof auth;
