import { AdminPanelFrame } from "./admin-panel-frame";
import { XpManager } from "./xp-manager";

/** Admin XP tools shown at the top of the leaderboard. */
export function LeaderboardXpPanel() {
	return (
		<AdminPanelFrame title="Admin dashboard · Leaderboard XP">
			<XpManager />
		</AdminPanelFrame>
	);
}
