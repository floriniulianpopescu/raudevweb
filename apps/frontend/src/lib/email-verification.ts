import { authClient } from "@/lib/auth-client";
import { authErrorMessage, NETWORK_ERROR } from "@/lib/errors";

/**
 * Where the confirmation link sends the user after the backend has checked it.
 * Success → /verify-email ; failure → /verify-email?error=TOKEN_EXPIRED | INVALID_TOKEN | USER_NOT_FOUND
 */
export const verifyCallbackURL = () => `${window.location.origin}/verify-email`;

/** Email a new confirmation link. Same answer whether or not the account exists. */
export async function resendVerificationEmail(email: string) {
	let result;
	try {
		result = await authClient.sendVerificationEmail({ email, callbackURL: verifyCallbackURL() });
	} catch {
		throw new Error(NETWORK_ERROR); // Better Auth throws when the server can't be reached
	}
	if (result.error) {
		throw new Error(authErrorMessage(result.error, "Couldn't send the email. Please try again."));
	}
}
