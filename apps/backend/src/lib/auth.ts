import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, createEmailVerificationToken } from "better-auth/api";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { bearer, admin } from "better-auth/plugins";
import { SignUpInputSchema } from "@raudevweb/shared";
import { prisma } from "./prisma";
import { escapeHtml, sendEmail } from "./email";

const FRONTEND_URL = (process.env.CORS_ORIGIN || "http://localhost:5173").replace(/\/+$/, "");

/**
 * Confirmation links sent without a site URL (e.g. on login) would otherwise land on the API's "/".
 * Point those at the frontend's /verify-email page instead.
 */
function withFrontendCallback(link: string) {
  const url = new URL(link);
  const callback = url.searchParams.get("callbackURL");
  if (!callback || callback.startsWith("/")) {
    url.searchParams.set("callbackURL", `${FRONTEND_URL}/verify-email`);
  }
  return url.toString();
}

const API_URL = (process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
const VERIFY_EXPIRES_IN = 60 * 60 * 24; // 24 hours

type EmailUser = { name?: string | null; email: string };
const greeting = (user: EmailUser) => (user.name ? `Hi ${user.name},` : "Hi,");

/** "Confirm your account" email. Not awaited by callers, so response timing never reveals registered emails. */
function sendConfirmationEmail(user: EmailUser, url: string) {
  const hi = greeting(user);
  void sendEmail({
    to: user.email,
    subject: "Confirm your RAUDEV account",
    text: `${hi}\n\nThanks for signing up to RAUDEV! Confirm your email address to activate your account (link valid for 24 hours):\n${url}\n\nIf you didn't create an account, you can ignore this email.`,
    html: `<p>${escapeHtml(hi)}</p><p>Thanks for signing up to RAUDEV! Confirm your email address to activate your account.</p><p><a href="${url}">Confirm my email</a> (valid for 24 hours)</p><p>If you didn't create an account, you can ignore this email.</p>`,
  }).catch((err) => console.error("[AUTH] Verification email failed:", err));
}

/** Sent when someone signs up with an email that already has a confirmed account. */
function sendAlreadyRegisteredEmail(user: EmailUser) {
  const hi = greeting(user);
  const login = `${FRONTEND_URL}/login`;
  const forgot = `${FRONTEND_URL}/forgot`;
  void sendEmail({
    to: user.email,
    subject: "You already have a RAUDEV account",
    text: `${hi}\n\nSomeone (hopefully you) just tried to create a RAUDEV account with this email, but you already have one.\n\nLog in: ${login}\nForgot your password? Reset it: ${forgot}\n\nIf this wasn't you, you can ignore this email. Your account hasn't been changed.`,
    html: `<p>${escapeHtml(hi)}</p><p>Someone (hopefully you) just tried to create a RAUDEV account with this email, but you already have one.</p><p><a href="${login}">Log in</a> · <a href="${forgot}">Reset your password</a></p><p>If this wasn't you, you can ignore this email. Your account hasn't been changed.</p>`,
  }).catch((err) => console.error("[AUTH] Already-registered email failed:", err));
}

// Better Auth endpoints that accept a user-supplied name
const NAME_PATHS = ["/sign-up/email", "/update-user"];

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: API_URL,
  trustedOrigins: [FRONTEND_URL],
  emailAndPassword: {
    enabled: true,
    // Users must click the link in the confirmation email before they can log in
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    // Sign-up with an email that's already registered: the page still shows "check your inbox"
    // (so it can't be used to find out who has an account), and the owner gets a useful email.
    async onExistingUserSignUp({ user }) {
      if (user.emailVerified) {
        sendAlreadyRegisteredEmail(user);
        return;
      }
      // Registered but never confirmed (e.g. lost the first email): send a fresh confirmation link
      const token = await createEmailVerificationToken(
        process.env.BETTER_AUTH_SECRET!,
        user.email,
        undefined,
        VERIFY_EXPIRES_IN,
      );
      const callback = encodeURIComponent(`${FRONTEND_URL}/verify-email`);
      sendConfirmationEmail(user, `${API_URL}/api/auth/verify-email?token=${token}&callbackURL=${callback}`);
    },
    // The fake "created" user returned for an existing email must look exactly like a real one
    // (the admin plugin adds role/ban fields), otherwise the API response would reveal it.
    customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
      ...coreFields,
      role: "user",
      banned: false,
      banReason: null,
      banExpires: null,
      ...additionalFields,
      id,
    }),
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
  emailVerification: {
    sendOnSignUp: true,
    // Logging in while unverified sends a fresh link (the old one may be lost/expired)
    sendOnSignIn: true,
    // Clicking the link confirms the email AND logs the user in
    autoSignInAfterVerification: true,
    expiresIn: VERIFY_EXPIRES_IN,
    async sendVerificationEmail({ user, url }) {
      sendConfirmationEmail(user, withFrontendCallback(url));
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
