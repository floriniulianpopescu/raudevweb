import { authClient } from "@/lib/auth-client";
import { authErrorMessage, NETWORK_ERROR } from "@/lib/errors";

/**
 * Ask the backend to email a password reset link (sent via Resend).
 * The link goes to the backend, which checks the token and then redirects to
 * /reset?token=… on this site (or /reset?error=INVALID_TOKEN).
 *
 * The backend answers the same way whether or not the account exists, so this
 * never reveals which emails are registered.
 */
export async function sendPasswordResetEmail(email: string) {
	let result;
	try {
		result = await authClient.requestPasswordReset({
			email,
			redirectTo: `${window.location.origin}/reset`,
		});
	} catch {
		throw new Error(NETWORK_ERROR); // Better Auth throws when the server can't be reached
	}
	if (result.error) {
		throw new Error(authErrorMessage(result.error, "Couldn't send the email. Please try again."));
	}
}
