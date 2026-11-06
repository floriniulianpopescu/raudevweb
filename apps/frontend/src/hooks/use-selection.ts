import { useCallback, useMemo, useState } from "react";

/**
 * Checkbox selection over a list of ids.
 * - `visibleIds`: what the user currently sees (after search) — "select all" acts on these.
 * - `allIds`: every loaded item — selected ids that no longer exist are dropped automatically.
 */
export function useSelection(visibleIds: string[], allIds: string[]) {
	const [raw, setRaw] = useState<Set<string>>(() => new Set());

	// Ignore ids that were deleted/reloaded away
	const selected = useMemo(() => {
		const existing = new Set(allIds);
		return new Set([...raw].filter((id) => existing.has(id)));
	}, [raw, allIds]);

	const visibleSelected = visibleIds.filter((id) => selected.has(id)).length;
	const allVisibleSelected = visibleIds.length > 0 && visibleSelected === visibleIds.length;

	const toggle = useCallback(
		(id: string) =>
			setRaw((prev) => {
				const next = new Set(prev);
				if (next.has(id)) next.delete(id);
				else next.add(id);
				return next;
			}),
		[],
	);

	const selectAll = useCallback(
		() => setRaw((prev) => new Set([...prev, ...visibleIds])),
		[visibleIds],
	);

	const clear = useCallback(() => setRaw(new Set()), []);

	return {
		selected,
		count: selected.size,
		/** Selected items hidden by the current search */
		hiddenCount: selected.size - visibleSelected,
		allVisibleSelected,
		someVisibleSelected: visibleSelected > 0 && !allVisibleSelected,
		isSelected: (id: string) => selected.has(id),
		toggle,
		selectAll,
		clear,
	};
}

export type Selection = ReturnType<typeof useSelection>;
