import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { bearer, admin } from "better-auth/plugins";
import { SignUpInputSchema } from "@raudevweb/shared";
import { prisma } from "./prisma";
import { sendEmail } from "./email";

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
    async sendResetPassword({ user, url }) {
      // Not awaited: waiting on the email provider only for existing users would let
      // response timing reveal which emails are registered
      void sendEmail({
        to: user.email,
        subject: "Reset your RAUDEV password",
        text: `We received a request to reset your password.\n\nOpen this link to choose a new one (valid for 1 hour):\n${url}\n\nIf you didn't request this, you can ignore this email.`,
        html: `<p>We received a request to reset your password.</p><p><a href="${url}">Choose a new password</a> (valid for 1 hour)</p><p>If you didn't request this, you can ignore this email.</p>`,
      }).catch((err) => console.error("[AUTH] Password reset email failed:", err));
    },
    async onPasswordReset({ user }) {
      // Invalidate any other pending reset links once the password has been changed
      await prisma.verification.deleteMany({
        where: { value: user.id, identifier: { startsWith: "reset-password:" } },
      });

      // Let the owner know, so an unexpected reset doesn't go unnoticed.
      // A failed notice must not fail the reset itself, which has already happened.
      void sendEmail({
        to: user.email,
        subject: "Your RAUDEV password was changed",
        text: `Your RAUDEV password was just changed and all your devices were signed out.\n\nIf this was you, no action is needed.\nIf it wasn't, reset your password again right away and contact us.`,
        html: `<p>Your RAUDEV password was just changed and all your devices were signed out.</p><p>If this was you, no action is needed.<br>If it wasn't, reset your password again right away and contact us.</p>`,
      }).catch((err) => console.error("[AUTH] Password changed notice failed:", err));
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
