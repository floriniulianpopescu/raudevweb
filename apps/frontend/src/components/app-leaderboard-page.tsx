import { useCallback, useEffect, useState } from "react";
import { MedalIcon, TrophyIcon } from "lucide-react";
import type { LeaderboardEntry, LeaderboardResponse } from "@raudevweb/shared";
import { AdminPanelFrame } from "@/components/admin/admin-panel-frame";
import { XpManager } from "@/components/admin/xp-manager";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const PODIUM_STYLES: Record<number, string> = {
	1: "text-yellow-500",
	2: "text-slate-400",
	3: "text-amber-700",
};

function Avatar({ name, image }: { name: string; image: string | null }) {
	const initials = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0]?.toUpperCase())
		.join("");
	return image ? (
		<img src={image} alt="" className="size-9 shrink-0 rounded-full object-cover" />
	) : (
		<span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
			{initials || "?"}
		</span>
	);
}

function RankCell({ rank }: { rank: number }) {
	const podium = PODIUM_STYLES[rank];
	const Icon = rank === 1 ? TrophyIcon : MedalIcon;
	return (
		<span className="flex w-10 shrink-0 items-center justify-center font-semibold tabular-nums">
			{podium ? <Icon className={cn("size-5", podium)} aria-label={`Rank ${rank}`} /> : `#${rank}`}
		</span>
	);
}

function Row({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
	return (
		<li
			className={cn(
				"flex items-center gap-3 px-4 py-3",
				isMe && "bg-primary/10",
				entry.rank <= 3 && "font-medium",
			)}
		>
			<RankCell rank={entry.rank} />
			<Avatar name={entry.name} image={entry.image} />
			<span className="flex min-w-0 flex-1 items-center gap-2">
				<span className="truncate">{entry.name}</span>
				{isMe && <Badge variant="secondary">You</Badge>}
			</span>
			<span className="shrink-0 font-semibold tabular-nums">{entry.xp.toLocaleString()} XP</span>
		</li>
	);
}

export function AppLeaderboardPage() {
	const [data, setData] = useState<LeaderboardResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Also used to refresh the board after an admin changes someone's XP
	const load = useCallback(
		() =>
			apiGet<LeaderboardResponse>("leaderboard")
				.then((d) => {
					setData(d);
					setError(null);
				})
				.catch((e: Error) => setError(e.message)),
		[],
	);

	useEffect(() => {
		load();
	}, [load]);

	const me = data?.me ?? null;
	const meInList = !!me && !!data?.entries.some((e) => e.id === me.id);

	return (
		<div className="mx-auto max-w-3xl">
			<h1 className="text-2xl font-bold">Leaderboard</h1>
			<p className="text-muted-foreground mt-2">See how you rank against others.</p>

			<AdminPanelFrame title="Admin dashboard · Leaderboard XP">
				<XpManager onChanged={load} />
			</AdminPanelFrame>

			{me && (
				<p className="mt-4 text-sm">
					You are <span className="font-semibold">#{me.rank}</span>
					{data && <> of {data.totalUsers}</>} with{" "}
					<span className="font-semibold">{me.xp.toLocaleString()} XP</span>.
				</p>
			)}

			<div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
				{error ? (
					<p className="p-4 text-sm text-destructive">{error}</p>
				) : !data ? (
					<div className="space-y-2 p-4">
						{Array.from({ length: 5 }, (_, i) => (
							<Skeleton key={i} className="h-10" />
						))}
					</div>
				) : data.entries.length === 0 ? (
					<p className="p-4 text-sm text-muted-foreground">No one on the board yet.</p>
				) : (
					<ol className="divide-y">
						{data.entries.map((e) => (
							<Row key={e.id} entry={e} isMe={e.id === me?.id} />
						))}
						{me && !meInList && (
							<>
								<li className="px-4 py-1 text-center text-muted-foreground" aria-hidden>
									⋯
								</li>
								<Row entry={me} isMe />
							</>
						)}
					</ol>
				)}
			</div>
		</div>
	);
}
