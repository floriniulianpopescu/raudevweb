import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/lib/query-client";

/**
 * Cached API data belongs to whoever is logged in (e.g. "You" on the leaderboard).
 * Drop it on logout or when a different account logs in, so nobody sees another user's data.
 */
export function SessionCacheGuard() {
	const { data: session, isPending } = authClient.useSession();
	const userId = isPending ? undefined : (session?.user.id ?? null);
	const last = useRef<string | null | undefined>(undefined);

	useEffect(() => {
		if (userId === undefined) return; // first session check still running
		if (last.current !== undefined && last.current !== userId) queryClient.clear();
		last.current = userId;
	}, [userId]);

	return null;
}
