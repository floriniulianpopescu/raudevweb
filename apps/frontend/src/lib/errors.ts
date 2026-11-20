import { ApiError } from "@/lib/admin-api";

export const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";
export const SERVER_ERROR = "Something went wrong on our side. Please try again in a moment.";
export const RATE_LIMIT_ERROR = "Too many requests. Please wait a minute and try again.";

/** Messages that don't depend on what the user was doing. */
function statusMessage(status: number): string | null {
	if (status === 429) return RATE_LIMIT_ERROR;
	if (status >= 500) return SERVER_ERROR;
	return null;
}

/**
 * A sentence for anything thrown by our API calls (request()/fetch).
 * `fallback` describes the action, e.g. "Couldn't save. Please try again.", and is used for other 4xx answers.
 */
export function friendlyError(e: unknown, fallback: string): string {
	if (e instanceof ApiError) {
		if (e.status === 401) return "Your session has expired. Log in again.";
		if (e.status === 403) return "You don't have permission to do that.";
		return statusMessage(e.status) ?? fallback;
	}
	// fetch() rejects with a TypeError when the server can't be reached
	return e instanceof TypeError ? NETWORK_ERROR : fallback;
}

/**
 * A sentence for a Better Auth `{ error }` result. Its own messages (e.g. "Invalid email or password")
 * are kept for normal 4xx answers; server errors and rate limits get ours.
 */
export function authErrorMessage(error: { status: number; message?: string }, fallback: string): string {
	return statusMessage(error.status) ?? (error.message || fallback);
}
