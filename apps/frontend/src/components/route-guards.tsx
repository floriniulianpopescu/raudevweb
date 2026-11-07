import { Navigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";

/**
 * Wraps routes that require authentication.
 * Redirects to /login if the user is not signed in.
 * Shows nothing while the session is loading (avoids flash).
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { data: session, isPending, isRefetching } = authClient.useSession();

	// Only wait on the very first load. Better Auth re-checks the session after sign-up/sign-in/etc.
	// and reports isPending during that re-check when logged out; hiding the page then would
	// unmount it and wipe its state (e.g. a filled-in form).
	if (isPending && !isRefetching) {
		return null;
	}

	if (!session) {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
}

/**
 * Wraps routes that should only be accessible to guests (login, signup, etc.).
 * Redirects to /home if the user is already signed in.
 */
export function GuestRoute({ children }: { children: React.ReactNode }) {
	const { data: session, isPending, isRefetching } = authClient.useSession();

	if (isPending && !isRefetching) {
		return null;
	}

	if (session) {
		return <Navigate to="/home" replace />;
	}

	return <>{children}</>;
}
