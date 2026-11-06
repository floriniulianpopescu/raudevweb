import { useEffect, useState } from "react";
import { CalendarDaysIcon, ClockIcon, MapPinIcon } from "lucide-react";
import type { SessionSchedule } from "@raudevweb/shared";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/admin-api";
import { formatDay, formatShort, sessionInfo, weekInfo, type SessionStatus } from "@/lib/schedule";
import { cn } from "@/lib/utils";

const STATUS: Record<SessionStatus, { label: string; className: string }> = {
	upcoming: { label: "Upcoming", className: "bg-primary/10 text-primary" },
	today: { label: "Today", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
	live: { label: "In progress", className: "bg-green-600/15 text-green-700 dark:text-green-400" },
	ended: { label: "Done this week", className: "bg-muted text-muted-foreground" },
};

/** Re-render every minute so the status flips to "In progress"/"Done" on its own. */
function useNow(intervalMs = 60_000) {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const id = setInterval(() => setNow(new Date()), intervalMs);
		return () => clearInterval(id);
	}, [intervalMs]);
	return now;
}

/** /home: current week + this week's physical session. */
export function SessionCard() {
	const [schedule, setSchedule] = useState<SessionSchedule | null>(null);
	const [error, setError] = useState<string | null>(null);
	const now = useNow();

	useEffect(() => {
		apiGet<SessionSchedule>("schedule")
			.then(setSchedule)
			.catch((e: Error) => setError(e.message));
	}, []);

	if (error) return <p className="mt-6 text-sm text-destructive">{error}</p>;
	if (!schedule) return <Skeleton className="mt-6 h-36 rounded-2xl" />;

	const week = weekInfo(now, schedule.semesterStart);
	const session = sessionInfo(now, schedule);
	const status = schedule.cancelled ? null : STATUS[session.status];

	return (
		<section className="mt-6 grid gap-4 rounded-2xl border bg-card p-5 text-card-foreground shadow-sm sm:grid-cols-[auto_1fr]">
			{/* Week */}
			<div className="flex flex-col items-center justify-center rounded-xl bg-primary/10 px-6 py-4 text-center">
				<span className="text-xs font-medium tracking-wide text-primary uppercase">
					{week.kind === "semester" ? "Semester week" : "Week"}
				</span>
				<span className="text-4xl font-bold tabular-nums text-primary">{week.number ?? "–"}</span>
				<span className="text-xs text-muted-foreground">
					{formatShort(week.monday)} – {formatShort(week.sunday)}
				</span>
			</div>

			{/* Session */}
			<div className="min-w-0 space-y-2">
				{schedule.title && (
					<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Physical session</p>
				)}
				<div className="flex flex-wrap items-center gap-2">
					<h2 className="text-lg font-semibold">{schedule.title || "Physical session"}</h2>
					{schedule.cancelled ? (
						<Badge variant="destructive">Cancelled this week</Badge>
					) : (
						status && <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>{status.label}</span>
					)}
				</div>

				{week.startsOn && (
					<p className="text-sm text-muted-foreground">The semester starts on {formatDay(week.startsOn)}.</p>
				)}

				<p className="flex items-center gap-2 text-sm">
					<CalendarDaysIcon className="size-4 shrink-0 text-muted-foreground" />
					<span className={cn("font-medium", schedule.cancelled && "line-through text-muted-foreground")}>
						{formatDay(session.start)}
					</span>
				</p>
				<p className="flex items-center gap-2 text-sm">
					<ClockIcon className="size-4 shrink-0 text-muted-foreground" />
					{schedule.startTime} – {schedule.endTime}
				</p>
				{schedule.location && (
					<p className="flex items-center gap-2 text-sm">
						<MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
						{schedule.location}
					</p>
				)}
				{schedule.note && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{schedule.note}</p>}
				{(session.status === "ended" || schedule.cancelled) && (
					<p className="text-sm text-muted-foreground">Next session: {formatDay(session.next)}</p>
				)}
			</div>
		</section>
	);
}
