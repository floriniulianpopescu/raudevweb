import { Suspense, type ComponentType } from "react";
import { authClient } from "@/lib/auth-client";
import { lazyPage } from "@/lib/lazy-page";

/**
 * Admin panels are only downloaded for admins: the role is checked *before* the
 * lazy component renders, so other users never fetch the admin code.
 * (The backend enforces the role on every admin endpoint regardless.)
 */
function adminOnly<P extends object>(Component: ComponentType<P>) {
	return function AdminOnly(props: P) {
		const { data: session } = authClient.useSession();
		if (session?.user.role !== "admin") return null;
		return (
			<Suspense fallback={null}>
				<Component {...props} />
			</Suspense>
		);
	};
}

export const AdminDashboard = adminOnly(lazyPage(() => import("./admin-dashboard"), "AdminDashboard"));
export const AdminContentPanel = adminOnly(lazyPage(() => import("./admin-content-panel"), "AdminContentPanel"));
export const LeaderboardXpPanel = adminOnly(lazyPage(() => import("./leaderboard-xp-panel"), "LeaderboardXpPanel"));
