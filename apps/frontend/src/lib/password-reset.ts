import { authClient } from "@/lib/auth-client";

/**
 * Ask the backend to email a password reset link (sent via Resend).
 * The link goes to the backend, which checks the token and then redirects to
 * /reset?token=… on this site (or /reset?error=INVALID_TOKEN).
 *
 * The backend answers the same way whether or not the account exists, so this
 * never reveals which emails are registered.
 */
export async function sendPasswordResetEmail(email: string) {
	const { error } = await authClient.requestPasswordReset({
		email,
		redirectTo: `${window.location.origin}/reset`,
	});
	if (error) {
		throw new Error(
			error.status === 429
				? "Too many requests. Please wait a minute and try again."
				: error.message || "Couldn't send the email. Please try again.",
		);
	}
}
