import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { redirectAfterLogin } from "@/lib/redirect";

/**
 * Session state for the route guards.
 *
 * `loading` is true only until the first session check has finished. Better Auth reports
 * `isRefetching: true` for every request, including that first one, so it can't be used to
 * tell the first load apart. Without this wait a hard load of /home/whatever would redirect
 * to /login before the session arrives, and from there to /home, losing the page.
 *
 * After the first check, later re-checks (after sign-up, sign-in, etc.) don't count as loading,
 * so the page stays mounted and keeps its state (e.g. a filled-in form).
 */
function useGuardSession() {
	const { data: session, isPending } = authClient.useSession();
	const [settled, setSettled] = useState(!isPending);
	if (!isPending && !settled) setSettled(true);
	return { session, loading: isPending && !settled };
}

/**
 * Wraps routes that require authentication.
 * Redirects to /login if the user is not signed in, remembering the page they asked for.
 * Shows nothing while the session is loading (avoids flash).
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { session, loading } = useGuardSession();
	const location = useLocation();

	if (loading) {
		return null;
	}

	if (!session) {
		const from = location.pathname + location.search + location.hash;
		return <Navigate to="/login" replace state={{ from }} />;
	}

	return <>{children}</>;
}

/**
 * Wraps routes that should only be accessible to guests (login, signup, etc.).
 * Redirects signed-in users to the page they were headed to, or /home.
 */
export function GuestRoute({ children }: { children: React.ReactNode }) {
	const { session, loading } = useGuardSession();
	const location = useLocation();

	if (loading) {
		return null;
	}

	if (session) {
		return <Navigate to={redirectAfterLogin(location)} replace />;
	}

	return <>{children}</>;
}
