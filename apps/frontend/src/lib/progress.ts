import { useMutation } from "@tanstack/react-query";
import { COMPLETION_XP, type CompletableType, type CompletionResult, type Progress } from "@raudevweb/shared";
import { apiGet, apiSend } from "@/lib/admin-api";
import { queryClient, queryKeys, useCachedQuery } from "@/lib/query-client";

/** What the signed-in user has ticked as done (shared by every check on the page). */
export function useProgress() {
	return useCachedQuery(queryKeys.progress, () => apiGet<Progress>("progress"));
}

/** Progress with one item flipped, for showing the tick before the server answers. */
function withToggled(progress: Progress, type: CompletableType, id: string, done: boolean): Progress {
	const { ids, xp } = progress[type];
	const has = ids.includes(id);
	if (has === done) return progress;
	const change = done ? COMPLETION_XP[type] : -COMPLETION_XP[type];
	return {
		...progress,
		[type]: { ids: done ? [...ids, id] : ids.filter((i) => i !== id), xp: Math.max(0, xp + change) },
	};
}

/**
 * Tick/untick one item. The check flips immediately (optimistic update); if the server
 * call fails it flips back. Afterwards progress and the leaderboard are refetched.
 */
export function useToggleDone(type: CompletableType, id: string) {
	return useMutation({
		mutationFn: (done: boolean) =>
			apiSend<CompletionResult>(`progress/${type}/${encodeURIComponent(id)}`, done ? "PUT" : "DELETE"),
		onMutate: async (done) => {
			await queryClient.cancelQueries({ queryKey: queryKeys.progress });
			const previous = queryClient.getQueryData<Progress>(queryKeys.progress);
			if (previous) queryClient.setQueryData(queryKeys.progress, withToggled(previous, type, id, done));
			return { previous };
		},
		onError: (_error, _done, context) => {
			if (context?.previous) queryClient.setQueryData(queryKeys.progress, context.previous);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.progress });
			queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard });
		},
	});
}

/** Problems and exercises can be ticked as done; other content types can't. */
export const isCompletable = (type: string): type is CompletableType => Object.hasOwn(COMPLETION_XP, type);
