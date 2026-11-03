import { useState } from "react";
import { BookOpenIcon, ListChecksIcon, PuzzleIcon, TrophyIcon } from "lucide-react";
import type { ContentType } from "@raudevweb/shared";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { LatestCard } from "@/components/home/latest-card";
import { SessionCard } from "@/components/home/session-card";
import { authClient } from "@/lib/auth-client";

/** The four "Latest …" cards on /home — swap types here to change them. */
const LATEST: { type: ContentType; icon: typeof PuzzleIcon }[] = [
	{ type: "challenges", icon: TrophyIcon },
	{ type: "problems", icon: PuzzleIcon },
	{ type: "quizzes", icon: ListChecksIcon },
	{ type: "lessons", icon: BookOpenIcon },
];

export function AppMainPage() {
	const { data: session } = authClient.useSession();
	// Bumped when an admin saves the schedule, to remount SessionCard with fresh data
	const [scheduleRev, setScheduleRev] = useState(0);

	return (
		<div>
			<h1 className="text-2xl font-bold">Hello, {session?.user.name}!</h1>
			<p className="text-muted-foreground mt-2">Here's what's happening this week.</p>

			<AdminDashboard onScheduleChanged={() => setScheduleRev((r) => r + 1)} />

			<SessionCard key={scheduleRev} />

			<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{LATEST.map(({ type, icon }) => (
					<LatestCard key={type} type={type} icon={icon} />
				))}
			</div>
		</div>
	);
}
