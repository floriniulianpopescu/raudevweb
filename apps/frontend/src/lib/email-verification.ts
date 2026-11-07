import { authClient } from "@/lib/auth-client";

/**
 * Where the confirmation link sends the user after the backend has checked it.
 * Success → /verify-email ; failure → /verify-email?error=TOKEN_EXPIRED | INVALID_TOKEN | USER_NOT_FOUND
 */
export const verifyCallbackURL = () => `${window.location.origin}/verify-email`;

/** Email a new confirmation link. Same answer whether or not the account exists. */
export async function resendVerificationEmail(email: string) {
	const { error } = await authClient.sendVerificationEmail({ email, callbackURL: verifyCallbackURL() });
	if (error) {
		throw new Error(
			error.status === 429
				? "Too many requests. Please wait a minute and try again."
				: error.message || "Couldn't send the email. Please try again.",
		);
	}
}
