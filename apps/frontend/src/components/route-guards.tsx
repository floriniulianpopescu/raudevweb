import { Navigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";

/**
 * Wraps routes that require authentication.
 * Redirects to /login if the user is not signed in.
 * Shows nothing while the session is loading (avoids flash).
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
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
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return null;
	}

	if (session) {
		return <Navigate to="/home" replace />;
	}

	return <>{children}</>;
}
