import type { Location } from "react-router-dom";

/**
 * Where a guest page (login) sends the user once signed in: the protected page they tried
 * to open (passed by ProtectedRoute as `state.from`), or /home.
 */
export function redirectAfterLogin(location: Location): string {
	const from = (location.state as { from?: unknown } | null)?.from;
	return typeof from === "string" && from.startsWith("/home") ? from : "/home";
}
