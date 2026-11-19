import { useEffect, useState } from "react";
import { CheckIcon } from "lucide-react";
import { COMPLETION_XP, type CompletableType } from "@raudevweb/shared";
import { useProgress, useToggleDone } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * "Done" tick for a problem/exercise (honor system). Ticking gives XP, unticking takes it back.
 * `compact` is the bare box for tight rows (home "Latest" cards; the row must be `relative`
 * for its "+20 XP" pop); otherwise it has a label.
 */
export function DoneCheck({
	type,
	id,
	title,
	compact = false,
}: {
	type: CompletableType;
	id: string;
	title: string;
	compact?: boolean;
}) {
	const { data: progress } = useProgress();
	const toggle = useToggleDone(type, id);
	const [pop, setPop] = useState<{ change: number; key: number } | null>(null);
	const [failed, setFailed] = useState(false);

	const xp = COMPLETION_XP[type];
	const done = !!progress?.[type].ids.includes(id);
	const disabled = !progress || toggle.isPending;

	useEffect(() => {
		if (!pop) return;
		const t = setTimeout(() => setPop(null), 1800);
		return () => clearTimeout(t);
	}, [pop]);

	useEffect(() => {
		if (!failed) return;
		const t = setTimeout(() => setFailed(false), 4000);
		return () => clearTimeout(t);
	}, [failed]);

	function onToggle() {
		setFailed(false);
		setPop(null);
		toggle.mutate(!done, {
			// Show what the server actually changed (0 if another tab already did it)
			onSuccess: (r) => r.xpChange !== 0 && setPop({ change: r.xpChange, key: Date.now() }),
			onError: () => setFailed(true),
		});
	}

	const label = done
		? `"${title}" is done. Untick to remove ${xp} XP`
		: `Mark "${title}" as done for ${xp} XP`;

	const box = (
		<span
			aria-hidden
			className={cn(
				"flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
				done ? "border-green-600 bg-green-600 text-white" : "border-muted-foreground/40 bg-background",
			)}
		>
			{done && <CheckIcon className="size-3.5" strokeWidth={3} />}
		</span>
	);

	const popEl = pop && (
		<span
			key={pop.key}
			className={cn(
				"pointer-events-none animate-in fade-in slide-in-from-bottom-2 text-xs font-semibold tabular-nums",
				pop.change > 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
				// Compact rows are tight: float a small pill over the end of the row (the parent row is `relative`)
				compact && "absolute top-1/2 right-7 z-10 -translate-y-1/2 rounded-full border bg-popover px-1.5 py-0.5 whitespace-nowrap shadow-sm",
			)}
		>
			{pop.change > 0 ? `+${pop.change}` : `−${-pop.change}`} XP
		</span>
	);

	const failedEl = failed && (
		<span
			role="alert"
			className={cn(
				"text-xs text-destructive",
				compact && "absolute top-1/2 right-7 z-10 -translate-y-1/2 rounded-full border bg-popover px-1.5 py-0.5 whitespace-nowrap shadow-sm",
			)}
		>
			Couldn&apos;t save. Try again.
		</span>
	);

	const buttonProps = {
		type: "button" as const,
		role: "checkbox",
		"aria-checked": done,
		"aria-label": label,
		title: label,
		disabled,
		onClick: onToggle,
	};

	if (compact) {
		return (
			<span className="flex shrink-0">
				<button
					{...buttonProps}
					className="rounded-md p-0.5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
				>
					{box}
				</button>
				<span aria-live="polite">{popEl}</span>
				{failedEl}
			</span>
		);
	}

	return (
		<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
			<button
				{...buttonProps}
				className={cn(
					"-ml-1 inline-flex items-center gap-2 rounded-lg px-1 py-1 text-sm font-medium transition-colors",
					"hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60",
					done && "text-green-700 dark:text-green-400",
				)}
			>
				{box}
				{done ? "Done" : "Mark as done"}
			</button>
			<span className="text-xs text-muted-foreground tabular-nums">{done ? `${xp} XP earned` : `+${xp} XP`}</span>
			<span aria-live="polite">{popEl}</span>
			{failedEl}
		</div>
	);
}

/** "7 / 20 done · 140 XP earned" for a list of problems or exercises. */
export function ProgressSummary({ type, itemIds }: { type: CompletableType; itemIds: string[] }) {
	const { data: progress } = useProgress();
	if (!progress || itemIds.length === 0) return null;
	const doneIds = new Set(progress[type].ids);
	const done = itemIds.filter((id) => doneIds.has(id)).length;
	return (
		<p className="mt-2 text-sm text-muted-foreground">
			<span className="font-semibold text-foreground tabular-nums">
				{done} / {itemIds.length}
			</span>{" "}
			done · <span className="font-semibold text-foreground tabular-nums">{progress[type].xp}</span> XP earned
		</p>
	);
}

/** "3 / 7 done · 50 XP earned" across a challenge's problems and exercises. */
export function ChallengeProgress({ problemIds, exerciseIds }: { problemIds: string[]; exerciseIds: string[] }) {
	const { data: progress } = useProgress();
	const total = problemIds.length + exerciseIds.length;
	if (!progress || total === 0) return null;
	const doneProblems = problemIds.filter((id) => progress.problems.ids.includes(id)).length;
	const doneExercises = exerciseIds.filter((id) => progress.exercises.ids.includes(id)).length;
	const xp = doneProblems * COMPLETION_XP.problems + doneExercises * COMPLETION_XP.exercises;
	return (
		<p className="text-sm text-muted-foreground">
			<span className="font-semibold text-foreground tabular-nums">
				{doneProblems + doneExercises} / {total}
			</span>{" "}
			done · <span className="font-semibold text-foreground tabular-nums">{xp}</span> XP earned
		</p>
	);
}
