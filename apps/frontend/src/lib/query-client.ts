import { QueryClient, useQuery, type QueryKey } from "@tanstack/react-query";
import { ApiError } from "@/lib/admin-api";

/**
 * Shared cache for API data. Pages show what's cached instantly (e.g. going Back to a list)
 * and refresh it in the background; data younger than `staleTime` isn't refetched at all.
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			gcTime: 10 * 60_000,
			// One quick retry for network blips and 5xx; 4xx (404, 401…) won't change by retrying
			retry: (failures, error) => failures < 1 && !(error instanceof ApiError && error.status < 500),
		},
	},
});

/** Cache keys. Admin managers invalidate these after saving so every page shows the change. */
export const queryKeys = {
	content: (path?: string) => (path === undefined ? ["content"] : ["content", path]),
	leaderboard: ["leaderboard"],
	schedule: ["schedule"],
} as const;

/**
 * `useQuery` with the app's conventions: `data` is null until loaded, `error` is only set
 * when there's nothing to show (a failed background refresh keeps the cached data), and
 * `retry()` goes back to the loading state and fetches again.
 */
export function useCachedQuery<T>(queryKey: QueryKey, fetcher: () => Promise<T>) {
	const { data, error } = useQuery({ queryKey, queryFn: fetcher });
	return { data: data ?? null, error: data === undefined ? error : null, retry: retryFailed };
}

/**
 * Retry every request that failed, not just the one whose button was clicked: errors usually
 * share a cause (the connection dropped), so one Retry should fix every card on the page.
 */
function retryFailed() {
	return queryClient.resetQueries({ predicate: (q) => q.state.status === "error" });
}
