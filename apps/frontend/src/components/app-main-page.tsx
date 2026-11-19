import { PageTitle } from "@/components/page-title";
import { BookOpenIcon, ListChecksIcon, PuzzleIcon, TrophyIcon } from "lucide-react";
import type { ContentType } from "@raudevweb/shared";
import { AdminDashboard } from "@/components/admin/lazy";
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

	return (
		<div>
			<PageTitle title="Home" />
			<h1 className="text-2xl font-bold">Hello, {session?.user.name}!</h1>
			<p className="text-muted-foreground mt-2">Here's what's happening this week.</p>

			<AdminDashboard />

			<SessionCard />

			<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{LATEST.map(({ type, icon }) => (
					<LatestCard key={type} type={type} icon={icon} />
				))}
			</div>
		</div>
	);
}
