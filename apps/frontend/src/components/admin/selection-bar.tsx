import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { Selection } from "@/hooks/use-selection";
import { cn } from "@/lib/utils";

/** Native checkbox that supports the "indeterminate" (partially selected) state. */
export function Checkbox({
	checked,
	indeterminate = false,
	onChange,
	label,
	className,
}: {
	checked: boolean;
	indeterminate?: boolean;
	onChange: () => void;
	label: string;
	className?: string;
}) {
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (ref.current) ref.current.indeterminate = indeterminate;
	}, [indeterminate]);

	return (
		<input
			ref={ref}
			type="checkbox"
			aria-label={label}
			checked={checked}
			onChange={onChange}
			className={cn("size-4 shrink-0 cursor-pointer accent-primary", className)}
		/>
	);
}

/**
 * Toolbar above a selectable list: master checkbox, Select all / Deselect all,
 * selection count, and bulk actions (passed as children, shown when something is selected).
 */
export function SelectionBar({
	selection,
	visibleCount,
	children,
}: {
	selection: Selection;
	visibleCount: number;
	children?: ReactNode;
}) {
	const { count, hiddenCount, allVisibleSelected, someVisibleSelected, selectAll, clear } = selection;

	return (
		<div
			className={cn(
				"mb-2 flex min-h-11 flex-wrap items-center gap-2 rounded-md px-2 py-1.5",
				count > 0 && "bg-muted",
			)}
		>
			<Checkbox
				label={allVisibleSelected ? "Deselect all" : "Select all"}
				checked={allVisibleSelected}
				indeterminate={someVisibleSelected}
				onChange={allVisibleSelected ? clear : selectAll}
			/>
			<Button size="xs" variant="ghost" disabled={visibleCount === 0 || allVisibleSelected} onClick={selectAll}>
				Select all
			</Button>
			<Button size="xs" variant="ghost" disabled={count === 0} onClick={clear}>
				Deselect all
			</Button>

			{count > 0 && (
				<>
					<span className="text-sm text-muted-foreground">
						{count} selected
						{hiddenCount > 0 && ` (${hiddenCount} hidden by search)`}
					</span>
					<span className="ml-auto flex flex-wrap items-center gap-2">{children}</span>
				</>
			)}
		</div>
	);
}
